import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(rootDir, "data");
const investmentsFile = path.join(dataDir, "investments.json");
const historyCacheFile = path.join(dataDir, "history-cache.json");

const tvColumns = [
  "name",
  "description",
  "close",
  "change",
  "volume",
  "market_cap_basic",
  "price_earnings_ttm",
  "price_book_fq",
  "price_sales_current",
  "enterprise_value_current",
  "earnings_per_share_basic_ttm",
  "dividends_yield_current",
  "return_on_equity_fq",
  "return_on_assets_fq",
  "debt_to_equity_fq",
  "total_revenue_ttm",
  "net_income_ttm",
  "sector",
  "Recommend.All",
  "Recommend.MA",
  "Recommend.Other",
  "RSI",
  "logoid"
];

async function readRemote(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0",
      ...(options.headers || {})
    }
  });
  return {
    status: response.status,
    body: await response.text()
  };
}

function send(res, status, body, contentType = "application/json; charset=utf-8") {
  res.statusCode = status;
  res.setHeader("content-type", contentType);
  res.setHeader("cache-control", "no-store");
  res.end(body);
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function normalizeInvestments(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => {
    return item &&
      typeof item.id === "string" &&
      typeof item.symbol === "string" &&
      Number.isFinite(Number(item.amount)) &&
      Number.isFinite(Number(item.buyPrice)) &&
      Number.isFinite(Number(item.shares));
  });
}

function normalizeHistoryRows(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => ({
      date: String(row.date || ""),
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume)
    }))
    .filter((row) => row.date && Number.isFinite(row.close) && row.close > 0);
}

async function readInvestmentsFile() {
  try {
    const content = await readFile(investmentsFile, "utf8");
    return normalizeInvestments(JSON.parse(content));
  } catch {
    return [];
  }
}

async function writeInvestmentsFile(investments) {
  const normalized = normalizeInvestments(investments);
  await mkdir(dataDir, { recursive: true });
  await writeFile(investmentsFile, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

async function readHistoryCacheFile() {
  try {
    const content = await readFile(historyCacheFile, "utf8");
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeHistoryCacheFile(cache) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(historyCacheFile, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
}

function marketProxy() {
  const handler = async (req, res, next) => {
    if (!req.url?.startsWith("/api/")) {
      next();
      return;
    }

    const requestUrl = new URL(req.url, "http://localhost");

    try {
      if (requestUrl.pathname === "/api/investments") {
        if (req.method === "GET") {
          send(res, 200, JSON.stringify({ investments: await readInvestmentsFile() }));
          return;
        }

        if (req.method === "POST") {
          const body = await readRequestBody(req);
          const payload = JSON.parse(body || "{}");
          const investments = await writeInvestmentsFile(payload.investments);
          send(res, 200, JSON.stringify({ investments }));
          return;
        }

        send(res, 405, JSON.stringify({ error: "Method not allowed" }));
        return;
      }

      if (requestUrl.pathname === "/api/history-cache") {
        const symbol = requestUrl.searchParams.get("symbol")?.toUpperCase().replace(/[^A-Z0-9.]/g, "");

        if (!symbol) {
          send(res, 400, JSON.stringify({ error: "Missing symbol" }));
          return;
        }

        if (req.method === "GET") {
          const cache = await readHistoryCacheFile();
          send(res, 200, JSON.stringify({ rows: normalizeHistoryRows(cache[symbol]?.rows), updatedAt: cache[symbol]?.updatedAt || null }));
          return;
        }

        if (req.method === "POST") {
          const body = await readRequestBody(req);
          const payload = JSON.parse(body || "{}");
          const rows = normalizeHistoryRows(payload.rows);
          const cache = await readHistoryCacheFile();
          cache[symbol] = { rows, updatedAt: new Date().toISOString() };
          await writeHistoryCacheFile(cache);
          send(res, 200, JSON.stringify({ rows, updatedAt: cache[symbol].updatedAt }));
          return;
        }

        send(res, 405, JSON.stringify({ error: "Method not allowed" }));
        return;
      }

      if (requestUrl.pathname === "/api/history") {
        const symbol = requestUrl.searchParams.get("symbol")?.toUpperCase().replace(/[^A-Z0-9.^-]/g, "");
        if (!symbol) {
          send(res, 400, JSON.stringify({ error: "Missing symbol" }));
          return;
        }

        const remoteUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`;
        const remote = await readRemote(remoteUrl);
        send(res, remote.status, remote.body);
        return;
      }

      if (requestUrl.pathname === "/api/screener") {
        const limit = Math.min(Number(requestUrl.searchParams.get("limit")) || 700, 1000);
        const payload = {
          markets: ["turkey"],
          symbols: { query: { types: [] }, tickers: [] },
          columns: tvColumns,
          sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
          range: [0, limit]
        };
        const remote = await readRemote("https://scanner.tradingview.com/turkey/scan", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        send(res, remote.status, remote.body);
        return;
      }

      if (requestUrl.pathname === "/api/fundamentals") {
        const code = requestUrl.searchParams.get("symbol")?.toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (!code) {
          send(res, 400, JSON.stringify({ error: "Missing symbol" }));
          return;
        }

        const payload = {
          symbols: { tickers: [`BIST:${code}`], query: { types: [] } },
          columns: tvColumns,
          range: [0, 1]
        };
        const remote = await readRemote("https://scanner.tradingview.com/turkey/scan", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        send(res, remote.status, remote.body);
        return;
      }

      next();
    } catch {
      send(res, 502, JSON.stringify({ error: "Market request failed" }));
    }
  };

  return {
    name: "market-proxy",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

export default defineConfig({
  plugins: [marketProxy(), react()],
  resolve: {
    preserveSymlinks: true
  },
  server: {
    hmr: {
      overlay: false
    }
  }
});
