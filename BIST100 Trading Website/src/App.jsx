import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import refreshCharacter from "./assets/refresh-character.png";

const fallbackStocks = [
  { symbol: "THYAO.TR", code: "THYAO", name: "Turk Hava Yollari A.O.", market: "BIST", sector: "Transportation" },
  { symbol: "ASELS.TR", code: "ASELS", name: "Aselsan Elektronik Sanayi ve Ticaret A.S.", market: "BIST", sector: "Electronic Technology" },
  { symbol: "GARAN.TR", code: "GARAN", name: "Turkiye Garanti Bankasi A.S.", market: "BIST", sector: "Finance" },
  { symbol: "KCHOL.TR", code: "KCHOL", name: "Koc Holding A.S.", market: "BIST", sector: "Consumer Durables" },
  { symbol: "BIMAS.TR", code: "BIMAS", name: "Bim Birlesik Magazalar A.S.", market: "BIST", sector: "Retail Trade" },
  { symbol: "EREGL.TR", code: "EREGL", name: "Eregli Demir ve Celik Fabrikalari", market: "BIST", sector: "Non-Energy Minerals" },
  { symbol: "TUPRS.TR", code: "TUPRS", name: "Tupras Turkiye Petrol Rafinerileri", market: "BIST", sector: "Energy Minerals" },
  { symbol: "AKBNK.TR", code: "AKBNK", name: "Akbank T.A.S.", market: "BIST", sector: "Finance" }
];

const demoRows = [
  ["2025-10-01", 265.25, 268.25, 259.5, 265.25, 28020896],
  ["2025-10-08", 284.25, 292.5, 282.75, 290.5, 37385296],
  ["2025-10-15", 290.75, 296, 288.5, 291, 36959749],
  ["2025-10-22", 296, 297, 290.75, 293, 34145288],
  ["2025-10-29", 294.5, 298.25, 294.5, 297.25, 37359500],
  ["2025-11-05", 298.5, 311.25, 298, 308.5, 70872223],
  ["2025-11-12", 316.75, 317.75, 311.75, 315.75, 34537595],
  ["2025-11-19", 331.25, 335.25, 329, 334, 24014896],
  ["2025-11-26", 338.75, 346.25, 337.75, 343.5, 34867256],
  ["2025-12-03", 335.5, 336, 316.5, 327.5, 35955211],
  ["2025-12-10", 313.25, 332.5, 310.25, 331.75, 52033362],
  ["2025-12-17", 327.5, 330.25, 324.5, 326, 43892594],
  ["2025-12-24", 318, 324.5, 316.5, 319.25, 37562966],
  ["2025-12-31", 306.25, 316.75, 305.5, 313.75, 32264093],
  ["2026-01-07", 309.25, 310.25, 300.25, 302, 31639213],
  ["2026-01-14", 293.25, 300.25, 290, 297.75, 51523112],
  ["2026-01-21", 278.25, 281, 266.5, 273, 54581700],
  ["2026-01-28", 270.75, 271.5, 266.75, 268.5, 22734301],
  ["2026-02-04", 279, 280.75, 273.75, 276.25, 31112755],
  ["2026-02-11", 273.75, 279, 270, 273.25, 53946056],
  ["2026-02-18", 277, 281.75, 276.25, 279, 38452648],
  ["2026-02-25", 271.75, 273.75, 267.75, 270.25, 30892643],
  ["2026-03-04", 273.25, 276.25, 270.75, 272.25, 34556393],
  ["2026-03-11", 277.75, 278.5, 273.75, 277.25, 31216523],
  ["2026-03-18", 265, 269.75, 262.75, 264.5, 31535713],
  ["2026-03-25", 279, 289.25, 272.5, 277.75, 32525018],
  ["2026-04-01", 291, 295.25, 287.5, 290.75, 71173468],
  ["2026-04-08", 288.5, 289, 279.5, 280.25, 47676029],
  ["2026-04-15", 299, 301, 294.75, 297, 52547045],
  ["2026-04-22", 300, 303, 294.25, 298, 92400525],
  ["2026-04-29", 308, 319.25, 308, 318.75, 84532266],
  ["2026-05-06", 337.5, 351.25, 337.25, 347.75, 61366265],
  ["2026-05-13", 314.5, 331, 310.25, 312.5, 94434599],
  ["2026-05-20", 286, 295.25, 282, 287, 60671396],
  ["2026-05-27", 294, 297, 288.75, 297, 75513242],
  ["2026-06-03", 321.5, 335, 317.75, 329, 108841541],
  ["2026-06-10", 325, 329, 322.75, 325.25, 41528415]
].map(([date, open, high, low, close, volume]) => ({ date, open, high, low, close, volume }));

const fieldLabels = {
  marketCap: "Piyasa Degeri",
  pe: "F/K",
  pb: "PD/DD",
  ps: "FD/Satis",
  ev: "Firma Degeri",
  eps: "HBK",
  dividendYield: "Temettu Verimi",
  roe: "Ozkaynak Karliligi",
  roa: "Aktif Karlilik",
  debtToEquity: "Borcluluk",
  revenue: "Satis Geliri",
  netIncome: "Net Kar"
};

function readSavedSymbol() {
  if (typeof window === "undefined") return "THYAO.TR";
  return normalizeSymbol(window.localStorage.getItem("selectedBistSymbol") || "THYAO.TR");
}

function readSavedInvestments() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem("bistInvestments") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readSavedWatchlist() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem("bistWatchlist") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeSymbol(value) {
  const clean = value.trim().toUpperCase().replace(/\s+/g, "").replace(/^BIST:/, "");
  if (!clean) return "";
  return `${clean.replace(/\.(TR|IS)$/u, "")}.TR`;
}

function toCode(symbol) {
  return normalizeSymbol(symbol).replace(".TR", "");
}

function toYahooSymbol(symbol) {
  return `${toCode(symbol)}.IS`;
}

function logoUrlFromId(logoid) {
  return logoid ? `https://s3-symbol-logo.tradingview.com/${logoid}.svg` : "";
}

function tradingViewToStock(row) {
  const data = row.d || [];
  const code = String(data[0] || row.s?.replace("BIST:", "") || "").toUpperCase();
  const recommendation = Number(data[18]);
  const maRecommendation = Number(data[19]);
  const technicalBase = Number.isFinite(maRecommendation) ? maRecommendation : recommendation;
  const technicalScore = Number.isFinite(technicalBase) ? Math.max(0, Math.min(100, Math.round(((technicalBase + 1) / 2) * 100))) : null;
  return {
    symbol: `${code}.TR`,
    code,
    name: data[1] || code,
    market: "BIST",
    sector: data[17] || data[9] || "-",
    logoUrl: logoUrlFromId(data[22]),
    quote: {
      close: Number(data[2]),
      change: Number(data[3]),
      volume: Number(data[4]),
      technicalScore,
      overallRecommendation: recommendation,
      maRecommendation,
      oscillatorRecommendation: Number(data[20]),
      rsi: Number(data[21])
    },
    fundamentals: {
      marketCap: Number(data[5]),
      pe: Number(data[6]),
      pb: Number(data[7]),
      ps: Number(data[8]),
      ev: Number(data[9]),
      eps: Number(data[10]),
      dividendYield: Number(data[11]),
      roe: Number(data[12]),
      roa: Number(data[13]),
      debtToEquity: Number(data[14]),
      revenue: Number(data[15]),
      netIncome: Number(data[16]),
      sector: data[17] || "-",
      recommendation
    }
  };
}

function parseYahooChart(payload) {
  const result = payload?.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const quote = result?.indicators?.quote?.[0];

  if (!quote || !timestamps.length) return [];

  return timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      open: Number(quote.open?.[index]),
      high: Number(quote.high?.[index]),
      low: Number(quote.low?.[index]),
      close: Number(quote.close?.[index]),
      volume: Number(quote.volume?.[index])
    }))
    .filter((row) => row.date && Number.isFinite(row.close) && row.close > 0);
}

function mergeTradingViewQuote(rows, stock) {
  const quote = stock?.quote;
  const close = Number(quote?.close);

  if (!Number.isFinite(close) || close <= 0 || !rows.length) return rows;

  const merged = rows.map((row) => ({ ...row }));
  const latest = merged.at(-1);
  latest.close = close;
  latest.high = Math.max(Number(latest.high) || close, close);
  latest.low = Math.min(Number(latest.low) || close, close);
  latest.volume = Number.isFinite(quote.volume) && quote.volume > 0 ? quote.volume : latest.volume;
  return merged;
}

async function fetchCachedHistory(symbol) {
  try {
    const response = await fetch(`/api/history-cache?symbol=${encodeURIComponent(toCode(symbol))}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Cache request failed");
    const payload = await response.json();
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    if (rows.length > 15) return { rows, source: "Gecmis cache" };
  } catch {
    // Browser-side fallback below.
  }

  try {
    const rows = JSON.parse(window.localStorage.getItem(`historyCache:${toCode(symbol)}`) || "[]");
    if (Array.isArray(rows) && rows.length > 15) return { rows, source: "Tarayici cache" };
  } catch {
    // Use demo rows if no cache exists.
  }

  return null;
}

async function persistHistoryCache(symbol, rows) {
  if (!Array.isArray(rows) || rows.length <= 15) return;
  window.localStorage.setItem(`historyCache:${toCode(symbol)}`, JSON.stringify(rows));

  try {
    await fetch(`/api/history-cache?symbol=${encodeURIComponent(toCode(symbol))}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rows })
    });
  } catch {
    // localStorage is enough as a fallback.
  }
}

async function fetchBistStocks() {
  try {
    const response = await fetch("/api/screener?limit=700", { cache: "no-store" });
    if (!response.ok) throw new Error("Screener failed");
    const payload = await response.json();
    const stocks = (payload.data || []).map(tradingViewToStock).filter((stock) => stock.code);
    if (stocks.length) return { stocks, source: "TradingView" };
  } catch {
    // Use built-in BIST shortlist if the screener is unreachable.
  }

  return { stocks: fallbackStocks, source: "Yedek liste" };
}

async function fetchFundamentals(symbol) {
  try {
    const response = await fetch(`/api/fundamentals?symbol=${encodeURIComponent(toCode(symbol))}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Fundamentals failed");
    const payload = await response.json();
    const row = payload.data?.[0];
    if (row) return { stock: tradingViewToStock(row), source: "TradingView" };
  } catch {
    // Keep the UI usable with technical-only analysis.
  }

  return { stock: null, source: "Temel veri yok" };
}

async function fetchStockHistory(symbol) {
  try {
    const response = await fetch(`/api/history?symbol=${encodeURIComponent(toYahooSymbol(symbol))}`, { cache: "no-store" });
    if (response.ok) {
      const payload = await response.json();
      const rows = parseYahooChart(payload);
      if (rows.length > 15) {
        await persistHistoryCache(symbol, rows);
        return { rows, source: "Yahoo Finance" };
      }
    }
  } catch {
    // Fall through to cached history.
  }

  const cached = await fetchCachedHistory(symbol);
  if (cached) return cached;

  return { rows: demoRows, source: "Ornek fiyat" };
}

async function fetchStoredInvestments() {
  try {
    const response = await fetch("/api/investments", { cache: "no-store" });
    if (!response.ok) throw new Error("Investments request failed");
    const payload = await response.json();
    return Array.isArray(payload.investments) ? payload.investments : [];
  } catch {
    return readSavedInvestments();
  }
}

async function persistInvestments(investments) {
  window.localStorage.setItem("bistInvestments", JSON.stringify(investments));

  try {
    await fetch("/api/investments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ investments })
    });
  } catch {
    // localStorage remains as a browser-side fallback.
  }
}

function formatMoney(value) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: value >= 100 ? 2 : 3 }).format(value);
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatCompact(value) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("tr-TR", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatShortDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function getNextSessionDate(from = new Date()) {
  const next = new Date(from);
  next.setDate(next.getDate() + 1);

  while ([0, 6].includes(next.getDay())) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function toOptionalNumber(value) {
  const normalized = String(value || "").replace(",", ".").trim();
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function movingAverage(rows, windowSize) {
  return rows.map((_, index) => {
    if (index + 1 < windowSize) return null;
    const slice = rows.slice(index + 1 - windowSize, index + 1);
    return slice.reduce((total, row) => total + row.close, 0) / windowSize;
  });
}

function calculateRsi(rows, period = 14) {
  if (rows.length <= period) return 50;
  const slice = rows.slice(-period - 1);
  let gains = 0;
  let losses = 0;

  for (let index = 1; index < slice.length; index += 1) {
    const change = slice[index].close - slice[index - 1].close;
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  if (losses === 0) return 100;
  return 100 - 100 / (1 + gains / losses);
}

function describeScoreImpact(value) {
  if (value >= 18) return "cok guclu pozitif";
  if (value >= 9) return "pozitif";
  if (value > -6) return "sinirli";
  return "negatif";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatZone(zone) {
  if (!zone) return "-";
  return `${formatMoney(zone.low)} - ${formatMoney(zone.high)}`;
}

function buildPriceZones(rows, latestClose, avgVolume) {
  const tolerance = Math.max(latestClose * 0.012, 0.01);
  const pivots = [];

  rows.forEach((row, index) => {
    const previous = rows[index - 1];
    const next = rows[index + 1];
    const volumeWeight = avgVolume > 0 ? clamp((row.volume || 0) / avgVolume, 0.6, 1.8) : 1;

    if (!previous || !next) return;

    if (row.low <= previous.low && row.low <= next.low) {
      pivots.push({ type: "support", price: row.low, volumeWeight });
    }

    if (row.high >= previous.high && row.high >= next.high) {
      pivots.push({ type: "resistance", price: row.high, volumeWeight });
    }
  });

  const cluster = (items) => {
    const clusters = [];
    items
      .sort((left, right) => left.price - right.price)
      .forEach((item) => {
        const match = clusters.find((current) => Math.abs(current.center - item.price) <= tolerance);
        if (match) {
          match.prices.push(item.price);
          match.score += item.volumeWeight;
          match.center = match.prices.reduce((total, price) => total + price, 0) / match.prices.length;
        } else {
          clusters.push({ center: item.price, prices: [item.price], score: item.volumeWeight });
        }
      });

    return clusters.map((item) => ({
      center: item.center,
      low: Math.min(...item.prices) - tolerance * 0.25,
      high: Math.max(...item.prices) + tolerance * 0.25,
      touches: item.prices.length,
      score: item.score
    }));
  };

  const supports = cluster(pivots.filter((pivot) => pivot.type === "support" && pivot.price <= latestClose));
  const resistances = cluster(pivots.filter((pivot) => pivot.type === "resistance" && pivot.price >= latestClose));
  const fallbackSupport = Math.min(...rows.map((row) => row.low));
  const fallbackResistance = Math.max(...rows.map((row) => row.high));
  const pickZone = (zones, fallback, isSupport) => {
    if (!zones.length) {
      return {
        center: fallback,
        low: fallback - tolerance * 0.35,
        high: fallback + tolerance * 0.35,
        touches: 1,
        score: 1
      };
    }

    return zones
      .map((zone) => ({
        ...zone,
        rank: zone.score * 2 + zone.touches - Math.abs(latestClose - zone.center) / latestClose * 20
      }))
      .sort((left, right) => right.rank - left.rank)[0];
  };

  return {
    supportZone: pickZone(supports, fallbackSupport, true),
    resistanceZone: pickZone(resistances, fallbackResistance, false)
  };
}

function calculateAnalysis(rows, fundamentals) {
  const latest = rows.at(-1);
  const previous = rows.at(-2) || latest;
  const firstVisible = rows[0] || latest;
  const ma20 = movingAverage(rows, 20).at(-1) || latest.close;
  const ma50 = movingAverage(rows, 50).at(-1) || ma20;
  const rsi = calculateRsi(rows);
  const rangeRows = rows.slice(-60);
  const avgVolume = rangeRows.reduce((total, row) => total + (row.volume || 0), 0) / Math.max(rangeRows.length, 1);
  const volumeRatio = avgVolume > 0 ? (latest.volume || 0) / avgVolume : 0;
  const { supportZone, resistanceZone } = buildPriceZones(rangeRows, latest.close, avgVolume);
  const support = supportZone.center;
  const resistance = resistanceZone.center;
  const dailyChange = ((latest.close - previous.close) / previous.close) * 100;
  const periodChange = ((latest.close - firstVisible.close) / firstVisible.close) * 100;
  const distanceToSupport = ((latest.close - support) / latest.close) * 100;
  const distanceToResistance = ((resistance - latest.close) / latest.close) * 100;
  const volatility = rangeRows.reduce((total, row) => total + ((row.high - row.low) / row.close) * 100, 0) / Math.max(rangeRows.length, 1);
  const trendBias = (latest.close > ma20 ? 0.22 : -0.18) + (ma20 > ma50 ? 0.18 : -0.12);
  const momentumBias = rsi < 35 ? 0.22 : rsi > 70 ? -0.24 : 0;
  const openMove = clamp(dailyChange * 0.16 + trendBias + momentumBias, -volatility * 0.35, volatility * 0.35);
  const predictedOpen = latest.close * (1 + openMove / 100);
  const closeMove = clamp(openMove * 0.35 + trendBias * 1.25 + (volumeRatio > 1.2 ? 0.12 : 0) - (distanceToResistance < 3 ? 0.22 : 0), -volatility * 0.45, volatility * 0.45);
  const predictedClose = predictedOpen * (1 + closeMove / 100);
  const forecastLow = Math.min(predictedOpen, predictedClose) * (1 - Math.min(volatility * 0.12, 0.75) / 100);
  const forecastHigh = Math.max(predictedOpen, predictedClose) * (1 + Math.min(volatility * 0.12, 0.75) / 100);
  const forecastChange = ((predictedClose - latest.close) / latest.close) * 100;
  const forecastDirection = forecastChange > 0.35 ? "Pozitif" : forecastChange < -0.35 ? "Negatif" : "Notr";
  const forecastConfidence = Math.abs(forecastChange) > 0.9 && volatility < 4 ? "Orta" : "Dusuk";
  const forecastSessionDate = getNextSessionDate();
  const financialFields = ["pe", "pb", "roe", "roa", "debtToEquity", "revenue", "netIncome"];
  const availableFinancialFields = financialFields.filter((key) => Number.isFinite(fundamentals?.[key]));
  const financialCoverage = availableFinancialFields.length / financialFields.length;
  const missingFinancialPenalty = financialCoverage < 0.35 ? -8 : financialCoverage < 0.6 ? -4 : 0;

  let score = 50;
  let financialImpact = 0;
  if (latest.close > ma20) score += 11;
  else score -= 9;
  if (ma20 > ma50) score += 10;
  else score -= 7;
  if (rsi < 35) score += 10;
  if (rsi > 70) score -= 13;
  if (periodChange > 8) score += 7;
  if (distanceToResistance < 3) score -= 7;
  if (distanceToSupport < 4) score += 5;
  if (volatility > 6) score -= 5;

  if (Number.isFinite(fundamentals?.pe)) {
    if (fundamentals.pe > 0 && fundamentals.pe < 8) financialImpact += 10;
    else if (fundamentals.pe > 0 && fundamentals.pe <= 15) financialImpact += 7;
    else if (fundamentals.pe > 25 && fundamentals.pe <= 35) financialImpact -= 4;
    else if (fundamentals.pe > 35) financialImpact -= 9;
  }
  if (Number.isFinite(fundamentals?.pb)) {
    if (fundamentals.pb > 0 && fundamentals.pb < 1.2) financialImpact += 8;
    else if (fundamentals.pb > 0 && fundamentals.pb <= 2.5) financialImpact += 4;
    else if (fundamentals.pb > 6) financialImpact -= 6;
  }
  if (Number.isFinite(fundamentals?.roe)) {
    if (fundamentals.roe > 25) financialImpact += 10;
    else if (fundamentals.roe > 15) financialImpact += 7;
    else if (fundamentals.roe < 5) financialImpact -= 6;
  }
  if (Number.isFinite(fundamentals?.roa)) {
    if (fundamentals.roa > 8) financialImpact += 5;
    else if (fundamentals.roa < 1) financialImpact -= 4;
  }
  if (Number.isFinite(fundamentals?.debtToEquity)) {
    if (fundamentals.debtToEquity < 0.8) financialImpact += 5;
    else if (fundamentals.debtToEquity > 2.5) financialImpact -= 8;
  }
  if (Number.isFinite(fundamentals?.netIncome)) {
    if (fundamentals.netIncome > 0) financialImpact += 4;
    else if (fundamentals.netIncome < 0) financialImpact -= 8;
  }
  if (Number.isFinite(fundamentals?.revenue) && fundamentals.revenue > 0) financialImpact += 2;
  if (Number.isFinite(fundamentals?.dividendYield) && fundamentals.dividendYield > 2) financialImpact += 3;
  financialImpact = Math.max(-22, Math.min(30, financialImpact));
  score += financialImpact;
  score += missingFinancialPenalty;
  if (Number.isFinite(fundamentals?.recommendation)) score += Math.round(fundamentals.recommendation * 12);

  if (rsi > 80) {
    score = Math.min(score, 64);
  } else if (rsi > 75 && distanceToResistance < 5) {
    score = Math.min(score, 67);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const action = score >= 68 ? "AL" : score <= 42 ? "SAT" : "BEKLE";
  const trendText = latest.close > ma20 && ma20 > ma50
    ? `Trend yapisi pozitif: fiyat MA20 uzerinde ve MA20, MA50'nin uzerinde.`
    : latest.close > ma20
      ? `Kisa vadede toparlanma var: fiyat MA20 uzerinde, ancak MA20/MA50 teyidi henuz tam guclu degil.`
      : `Trend zayif: fiyat MA20 altinda kaldigi icin yukari hareket icin yeniden ortalama uzerine cikmasi izlenmeli.`;
  const momentumText = rsi > 70
    ? `Momentum isinmis: RSI ${rsi.toFixed(1)} ile asiri alim bolgesine yakin, yeni alimlarda aceleci davranmak riskli olabilir.`
    : rsi < 35
      ? `Momentum baski altinda: RSI ${rsi.toFixed(1)} ile asiri satim tarafina yakin, tepki denemesi takip edilebilir.`
      : `Momentum dengeli: RSI ${rsi.toFixed(1)} ile ne asiri alim ne de asiri satim bolgesinde.`;
  const levelText = distanceToResistance < 4
    ? `Fiyat direnc bolgesine yakin: ${formatZone(resistanceZone)} araligina mesafe yaklasik ${distanceToResistance.toFixed(1)}%, bu alanda kar satisi riski artar.`
    : distanceToSupport < 4
      ? `Fiyat destek bolgesine yakin: ${formatZone(supportZone)} araligina mesafe yaklasik ${distanceToSupport.toFixed(1)}%, stop seviyesi icin kritik alan.`
      : `Fiyat destek ve direnc arasinda dengede: destek bolgesi ${formatZone(supportZone)}, direnc bolgesi ${formatZone(resistanceZone)}.`;
  const forecastText = `${formatShortDate(forecastSessionDate)} seansi icin kisa vadeli egilim ${forecastDirection.toLowerCase()}. Model araligi ${formatMoney(forecastLow)} - ${formatMoney(forecastHigh)}, guven ${forecastConfidence.toLowerCase()}.`;
  const riskText = volatility > 6
    ? `Volatilite yuksek: son 60 gun ortalama gun ici oynaklik ${volatility.toFixed(2)}%, pozisyon boyutu daha dikkatli secilmeli.`
    : `Volatilite kontrollu: son 60 gun ortalama gun ici oynaklik ${volatility.toFixed(2)}%.`;
  const volumeText = volumeRatio > 1.4
    ? `Hacim ortalamanin uzerinde: son hacim 60 gunluk ortalamanin ${volumeRatio.toFixed(1)} kati, hareketin ilgisi artmis.`
    : volumeRatio > 0
      ? `Hacim normal: son hacim 60 gunluk ortalamanin ${volumeRatio.toFixed(1)} kati seviyesinde.`
      : `Hacim verisi sinirli, hacim teyidi zayif okunmali.`;
  const valuationText = Number.isFinite(fundamentals?.pe)
    ? `Temel taraf ${describeScoreImpact(financialImpact)} katkida: F/K ${formatMoney(fundamentals.pe)}, PD/DD ${formatMoney(fundamentals.pb)}, ROE ${Number.isFinite(fundamentals?.roe) ? `${formatMoney(fundamentals.roe)}%` : "-"}, borcluluk ${Number.isFinite(fundamentals?.debtToEquity) ? formatMoney(fundamentals.debtToEquity) : "-"} ve karlilik birlikte puanlandi. Veri kapsami ${availableFinancialFields.length}/${financialFields.length}${missingFinancialPenalty ? `, eksik veri puani ${missingFinancialPenalty}` : ""}.`
    : `Temel veri sinirli: ${availableFinancialFields.length}/${financialFields.length} ana finansal alan geldi. Bu nedenle model teknik agirligi artirdi ve eksik veri puani ${missingFinancialPenalty} olarak yansitti.`;
  const decisionText = action === "AL"
    ? `Tek skor ${score}/100: teknik gorunum ve finansal kalite birlikte yeterli esigi asti.`
    : action === "SAT"
      ? `Tek skor ${score}/100: zayif teknik gorunum veya finansal/risk baskisi satis sinyalini one cikardi.`
      : rsi > 80
        ? `Tek skor ${score}/100: trend veya finansallar guclu olsa bile RSI ${rsi.toFixed(1)} cok isinmis oldugu icin model AL sinyalini frenledi.`
        : rsi > 75 && distanceToResistance < 5
          ? `Tek skor ${score}/100: RSI yuksek ve fiyat direnc bolgesine yakin oldugu icin model yeni giris icin beklemeyi tercih etti.`
      : financialImpact >= 18
        ? `Tek skor ${score}/100: finansallar guclu, ancak teknik giris veya risk kosullari henuz AL esigini net gecirmedi.`
        : `Tek skor ${score}/100: modelde olumlu ve olumsuz sinyaller dengede kaldigi icin bekleme agirlikta.`;

  return {
    latest,
    dailyChange,
    periodChange,
    ma20,
    ma50,
    rsi,
    support,
    resistance,
    supportZone,
    resistanceZone,
    avgVolume,
    volumeRatio,
    volatility,
    distanceToSupport,
    distanceToResistance,
    financialImpact,
    financialCoverage,
    missingFinancialPenalty,
    predictedOpen,
    predictedClose,
    forecastLow,
    forecastHigh,
    forecastChange,
    forecastDirection,
    forecastConfidence,
    forecastSessionDate,
    score,
    action,
    buyZone: latest.close <= ma20 ? `Destek bolgesi izlenebilir: ${formatZone(supportZone)}` : `${formatMoney(ma20)} veya ${formatZone(supportZone)} civarina geri cekilme`,
    sellZone: distanceToResistance < 4 ? "Dirence yakin, kar alimi dusunulebilir" : `${formatZone(resistanceZone)} direnc bolgesi`,
    reasons: [
      { title: "Trend", text: trendText },
      { title: "Momentum", text: momentumText },
      { title: "Destek / Direnc", text: levelText },
      { title: "Risk", text: riskText },
      { title: "Hacim", text: volumeText },
      { title: "Temel", text: valuationText },
      { title: "Tahmin", text: forecastText },
      { title: "Karar", text: decisionText }
    ]
  };
}

function StockChart({ rows, zoom, fromDate, toDate, investments = [], activeSymbol }) {
  const width = 960;
  const height = 380;
  const padding = { top: 24, right: 54, bottom: 42, left: 62 };
  const [panOffset, setPanOffset] = useState(0);
  const [cursor, setCursor] = useState(null);
  const dragRef = useRef(null);
  const filteredRows = useMemo(() => {
    return rows.filter((row) => (!fromDate || row.date >= fromDate) && (!toDate || row.date <= toDate));
  }, [fromDate, rows, toDate]);
  const visibleCount = Math.max(18, Math.round(filteredRows.length / zoom));
  const maxOffset = Math.max(0, filteredRows.length - visibleCount);
  const filtered = useMemo(() => {
    const safeOffset = Math.min(panOffset, maxOffset);
    const end = Math.max(visibleCount, filteredRows.length - safeOffset);
    const start = Math.max(0, end - visibleCount);
    return filteredRows.slice(start, end);
  }, [filteredRows, maxOffset, panOffset, visibleCount]);

  useEffect(() => {
    setPanOffset((value) => Math.min(value, maxOffset));
  }, [maxOffset]);

  useEffect(() => {
    setPanOffset(0);
  }, [fromDate, rows, toDate, zoom]);

  const chartData = filtered.length > 1 ? filtered : rows.slice(-30);
  const ma20 = movingAverage(chartData, 20);
  const minPrice = Math.min(...chartData.map((row) => row.low));
  const maxPrice = Math.max(...chartData.map((row) => row.high));
  const maxVolume = Math.max(...chartData.map((row) => row.volume || 0));
  const priceRange = maxPrice - minPrice || 1;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const candleWidth = Math.max(4, Math.min(18, (plotWidth / chartData.length) * 0.58));
  const x = (index) => padding.left + (index / Math.max(chartData.length - 1, 1)) * plotWidth;
  const y = (value) => padding.top + ((maxPrice - value) / priceRange) * (plotHeight * 0.76);
  const volumeY = (value) => height - padding.bottom - (value / Math.max(maxVolume, 1)) * (plotHeight * 0.18);
  const priceAtY = (cursorY) => maxPrice - ((cursorY - padding.top) / (plotHeight * 0.76)) * priceRange;
  const maPath = ma20.map((value, index) => (value ? `${index === 0 || !ma20[index - 1] ? "M" : "L"} ${x(index)} ${y(value)}` : "")).join(" ");
  const labels = [chartData[0], chartData[Math.floor(chartData.length / 2)], chartData.at(-1)].filter(Boolean);
  const buyMarkers = investments
    .filter((investment) => investment.symbol === activeSymbol)
    .map((investment) => {
      const investmentDate = new Date(investment.createdAt).toISOString().slice(0, 10);
      let index = chartData.findIndex((row) => row.date >= investmentDate);
      if (index < 0) index = chartData.length - 1;
      const row = chartData[index];
      return row ? { investment, index, row } : null;
    })
    .filter(Boolean);

  const moveCursor = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * width;
    const svgY = ((event.clientY - rect.top) / rect.height) * height;

    if (svgX < padding.left || svgX > width - padding.right || svgY < padding.top || svgY > height - padding.bottom) {
      setCursor(null);
      return;
    }

    setCursor({ x: svgX, y: svgY, price: priceAtY(svgY) });

    if (dragRef.current) {
      const delta = event.clientX - dragRef.current.startX;
      const candleStep = Math.max(1, plotWidth / Math.max(chartData.length, 1));
      const nextOffset = Math.round(dragRef.current.startOffset + delta / candleStep);
      setPanOffset(Math.max(0, Math.min(maxOffset, nextOffset)));
    }
  };

  const startDrag = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startOffset: panOffset };
  };

  const stopDrag = () => {
    dragRef.current = null;
  };

  return (
    <div className="chart-shell" aria-label="Hisse fiyat grafigi">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        onPointerDown={startDrag}
        onPointerMove={moveCursor}
        onPointerUp={stopDrag}
        onPointerLeave={() => {
          stopDrag();
          setCursor(null);
        }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const price = maxPrice - priceRange * tick;
          const lineY = y(price);
          return (
            <g key={tick}>
              <line className="grid-line" x1={padding.left} x2={width - padding.right} y1={lineY} y2={lineY} />
              <text className="axis-label" x={width - padding.right + 10} y={lineY + 4}>{formatMoney(price)}</text>
            </g>
          );
        })}
        {chartData.map((row, index) => {
          const candleX = x(index);
          const isUp = row.close >= row.open;
          const bodyTop = y(Math.max(row.open, row.close));
          const bodyHeight = Math.max(2, Math.abs(y(row.open) - y(row.close)));
          return (
            <g className={isUp ? "candle up" : "candle down"} key={`${row.date}-${index}`}>
              <line x1={candleX} x2={candleX} y1={y(row.high)} y2={y(row.low)} />
              <rect x={candleX - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} rx="2" />
              <rect className="volume-bar" x={candleX - candleWidth / 2} y={volumeY(row.volume || 0)} width={candleWidth} height={height - padding.bottom - volumeY(row.volume || 0)} rx="2" />
            </g>
          );
        })}
        <path className="ma-line" d={maPath} />
        {buyMarkers.map(({ investment, index, row }) => (
          <g className="buy-marker" key={investment.id} transform={`translate(${x(index)} ${y(row.low) + 18})`}>
            <path d="M 0 -10 L 8 6 L -8 6 Z" />
            <text y="24" textAnchor="middle">{investment.code}</text>
          </g>
        ))}
        {cursor ? (
          <g className="cursor-layer">
            <line x1={padding.left} x2={width - padding.right} y1={cursor.y} y2={cursor.y} />
            <line x1={cursor.x} x2={cursor.x} y1={padding.top} y2={height - padding.bottom} />
            <rect x={width - padding.right + 2} y={cursor.y - 13} width="50" height="26" rx="5" />
            <text x={width - padding.right + 27} y={cursor.y + 4} textAnchor="middle">{formatMoney(cursor.price)}</text>
          </g>
        ) : null}
        {labels.map((row, index) => (
          <text className="date-label" x={x(chartData.indexOf(row))} y={height - 12} textAnchor={index === 0 ? "start" : index === labels.length - 1 ? "end" : "middle"} key={row.date}>{row.date}</text>
        ))}
      </svg>
      <div className="pan-status">
        <span>{panOffset > 0 ? `${panOffset} mum geridesin` : "Son veriler"}</span>
        <button type="button" onClick={() => setPanOffset(0)}>Sona don</button>
      </div>
    </div>
  );
}

function StockLogo({ stock, size = "md" }) {
  const [failed, setFailed] = useState(false);
  const code = stock?.code || toCode(stock?.symbol || "");
  const logoUrl = stock?.logoUrl;

  if (logoUrl && !failed) {
    return (
      <span className={`stock-logo stock-logo-${size}`}>
        <img src={logoUrl} alt="" onError={() => setFailed(true)} />
      </span>
    );
  }

  return (
    <span className={`stock-logo stock-logo-${size} logo-fallback`} aria-hidden="true">
      {code.slice(0, 2)}
    </span>
  );
}

export default function App() {
  const [symbol, setSymbol] = useState(readSavedSymbol);
  const [query, setQuery] = useState(() => toCode(readSavedSymbol()));
  const [stocks, setStocks] = useState(fallbackStocks);
  const [universeSource, setUniverseSource] = useState("Yedek liste");
  const [rows, setRows] = useState(demoRows);
  const [fundamentals, setFundamentals] = useState({});
  const [selectedStock, setSelectedStock] = useState(fallbackStocks[0]);
  const [historySource, setHistorySource] = useState("Ornek fiyat");
  const [fundamentalSource, setFundamentalSource] = useState("Temel veri yok");
  const [status, setStatus] = useState("loading");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [investmentNote, setInvestmentNote] = useState("");
  const [stopLossInput, setStopLossInput] = useState("");
  const [targetPriceInput, setTargetPriceInput] = useState("");
  const [investments, setInvestments] = useState(readSavedInvestments);
  const [investmentsLoaded, setInvestmentsLoaded] = useState(false);
  const [watchlist, setWatchlist] = useState(readSavedWatchlist);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(true);
  const [refreshAnimationKey, setRefreshAnimationKey] = useState(0);
  const [zoom, setZoom] = useState(1.4);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const stocksRef = useRef(stocks);

  useEffect(() => {
    stocksRef.current = stocks;
  }, [stocks]);

  useEffect(() => {
    window.localStorage.setItem("selectedBistSymbol", symbol);
  }, [symbol]);

  useEffect(() => {
    window.localStorage.setItem("bistWatchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    const updateNavSize = () => {
      setIsNavExpanded(window.scrollY > 24);
    };

    updateNavSize();
    window.addEventListener("scroll", updateNavSize, { passive: true });
    return () => window.removeEventListener("scroll", updateNavSize);
  }, []);

  useEffect(() => {
    let ignore = false;
    fetchStoredInvestments().then((stored) => {
      if (ignore) return;
      setInvestments(stored.length ? stored : readSavedInvestments());
      setInvestmentsLoaded(true);
    });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (investmentsLoaded) persistInvestments(investments);
  }, [investments, investmentsLoaded]);

  useEffect(() => {
    let ignore = false;
    fetchBistStocks().then((result) => {
      if (ignore) return;
      setStocks(result.stocks);
      setUniverseSource(result.source);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const loadSelectedStock = useCallback(async ({ resetView = false } = {}) => {
    setStatus("loading");
    const [history, finance] = await Promise.all([fetchStockHistory(symbol), fetchFundamentals(symbol)]);
    const match = stocksRef.current.find((item) => item.symbol === symbol);
    const resolvedStock = finance.stock || match || { symbol, code: toCode(symbol), name: toCode(symbol), market: "BIST" };
    const rowsWithTradingViewPrice = mergeTradingViewQuote(history.rows, resolvedStock);

    setRows(rowsWithTradingViewPrice);
    setSelectedStock(resolvedStock);
    setFundamentals(resolvedStock.fundamentals || {});
    setHistorySource(history.source);
    setFundamentalSource(finance.source);
    if (finance.source.includes("TradingView")) {
      await persistHistoryCache(symbol, rowsWithTradingViewPrice);
    }

    setStatus(history.source.includes("Yahoo") || history.source.includes("cache") || finance.source.includes("TradingView") ? "ready" : "demo");
    setLastUpdated(new Date());
    setRefreshAnimationKey((current) => current + 1);

    if (resetView) {
      setFromDate("");
      setToDate("");
    }
  }, [symbol]);

  useEffect(() => {
    let ignore = false;
    loadSelectedStock({ resetView: true }).catch(() => {
      if (!ignore) setStatus("demo");
    });
    return () => {
      ignore = true;
    };
  }, [loadSelectedStock]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      fetchBistStocks().then((result) => {
        setStocks(result.stocks);
        setUniverseSource(result.source);
      });
      loadSelectedStock({ resetView: false }).catch(() => setStatus("demo"));
    }, 30000);

    return () => window.clearInterval(timer);
  }, [loadSelectedStock]);

  const analysis = useMemo(() => calculateAnalysis(rows, fundamentals), [fundamentals, rows]);

  const getCurrentPrice = useCallback((investment) => {
    if (investment.symbol === symbol) return analysis.latest.close;
    const match = stocks.find((item) => item.symbol === investment.symbol);
    return Number.isFinite(match?.quote?.close) ? match.quote.close : investment.buyPrice;
  }, [analysis.latest.close, stocks, symbol]);

  const investmentSummary = useMemo(() => {
    return investments.reduce((summary, investment) => {
      const currentPrice = getCurrentPrice(investment);
      const currentValue = investment.shares * currentPrice;
      const profit = currentValue - investment.amount;

      return {
        invested: summary.invested + investment.amount,
        current: summary.current + currentValue,
        profit: summary.profit + profit
      };
    }, { invested: 0, current: 0, profit: 0 });
  }, [getCurrentPrice, investments]);

  const activeAlerts = useMemo(() => {
    return investments.filter((investment) => {
      const currentPrice = getCurrentPrice(investment);
      const stopHit = Number.isFinite(investment.stopLoss) && currentPrice <= investment.stopLoss;
      const targetHit = Number.isFinite(investment.targetPrice) && currentPrice >= investment.targetPrice;
      return stopHit || targetHit;
    });
  }, [getCurrentPrice, investments]);

  const suggestions = useMemo(() => {
    const clean = query.trim().toUpperCase().replace(/^BIST:/, "").replace(/\.(TR|IS)$/u, "");
    return stocks
      .filter((item) => !clean || item.code.includes(clean) || item.name.toUpperCase().includes(clean))
      .slice(0, clean ? 28 : 80);
  }, [query, stocks]);

  const technicalLeaders = useMemo(() => {
    return stocks
      .filter((item) => Number.isFinite(item.quote?.technicalScore) && item.quote.technicalScore >= 90)
      .sort((left, right) => {
        const scoreDiff = right.quote.technicalScore - left.quote.technicalScore;
        if (scoreDiff !== 0) return scoreDiff;
        return Math.abs(Number(right.quote?.change) || 0) - Math.abs(Number(left.quote?.change) || 0);
      })
      .slice(0, 30);
  }, [stocks]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalized = normalizeSymbol(query);
    if (normalized) setSymbol(normalized);
  };

  const refreshNow = async () => {
    setIsRefreshing(true);
    try {
      const result = await fetchBistStocks();
      setStocks(result.stocks);
      setUniverseSource(result.source);
      await loadSelectedStock({ resetView: false });
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleWatchlist = (stockSymbol) => {
    setWatchlist((current) => {
      if (current.includes(stockSymbol)) return current.filter((item) => item !== stockSymbol);
      return [stockSymbol, ...current];
    });
  };

  const updateInvestment = (id, patch) => {
    setInvestments((current) => current.map((investment) => investment.id === id ? { ...investment, ...patch } : investment));
  };

  const addInvestment = (event) => {
    event.preventDefault();
    const amount = Number(String(investmentAmount).replace(",", "."));
    const buyPrice = analysis.latest.close;

    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(buyPrice) || buyPrice <= 0) return;

    setInvestments((current) => [
      {
        id: `${Date.now()}-${selectedStock.code || toCode(symbol)}`,
        symbol,
        code: selectedStock.code || toCode(symbol),
        name: selectedStock.name || toCode(symbol),
        amount,
        buyPrice,
        shares: amount / buyPrice,
        note: investmentNote.trim(),
        stopLoss: toOptionalNumber(stopLossInput),
        targetPrice: toOptionalNumber(targetPriceInput),
        createdAt: new Date().toISOString()
      },
      ...current
    ]);
    setInvestmentAmount("");
    setInvestmentNote("");
    setStopLossInput("");
    setTargetPriceInput("");
  };

  const removeInvestment = (id) => {
    setInvestments((current) => current.filter((investment) => investment.id !== id));
  };

  return (
    <main className="market-app">
      <header className={`topbar ${isNavExpanded ? "is-scrolled" : ""}`}>
        <a className="brand" href="#top" aria-label="BIST analiz paneli">
          <span className="brand-mark">BI</span>
          <span>BIST Terminal</span>
        </a>
        <nav className="nav-links" aria-label="Sayfa bolumleri">
          <a href="#search">Semboller</a>
          <a href="#watchlist">Favoriler</a>
          <a href="#technical-leaders">90+ Trend</a>
          <a href="#portfolio">Portfoy</a>
          <a href="#chart">Grafik</a>
          <a href="#news">Haber/KAP</a>
          <a href="#financials">Finansallar</a>
          <a href="#analysis">Analiz</a>
        </nav>
      </header>

      <section className="hero-band" id="top">
        <div>
          <p className="eyebrow">Borsa Istanbul veri paneli</p>
          <h1>BIST hisselerini ara, teknik ve temel sinyali birlikte oku.</h1>
          <p>
            Hisse evreni ve finansallar TradingView scanner uzerinden, fiyat gecmisi Yahoo Finance
            Istanbul sembolleri uzerinden cekilir. Sinyaller bilgilendirme amaclidir.
          </p>
        </div>
        <div className="hero-search-card" id="search">
          <form className="search-box" onSubmit={handleSubmit}>
            <label htmlFor="stock-search">BIST hisse ara</label>
            <div className="search-row">
              <input
                id="stock-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="THYAO, ASELS, GARAN"
                autoComplete="off"
              />
              <button type="submit">Ara</button>
            </div>
          </form>

            <div className="source-line">
              <span>{universeSource}</span>
              <button type="button" onClick={() => setQuery("")}>Tum liste</button>
              <strong>{stocks.length} sembol</strong>
            </div>

          <div className="suggestions compact-suggestions" aria-label="BIST hisse listesi">
            {suggestions.map((item) => (
              <button
                type="button"
                key={item.symbol}
                onClick={() => {
                  setQuery(item.code);
                  setSymbol(item.symbol);
                }}
              >
                <span className="symbol-line">
                  <StockLogo stock={item} size="sm" />
                  <span>
                    <strong>{item.code}</strong>
                    <small>{item.name}</small>
                  </span>
                </span>
                <em>{Number.isFinite(item.quote?.change) ? formatPercent(item.quote.change) : "BIST"}</em>
              </button>
            ))}
          </div>
        </div>

        <div className="market-status">
          <span className={status === "ready" ? "pulse" : "pulse muted"} />
          <strong>{historySource} + {fundamentalSource}</strong>
          <button type="button" onClick={refreshNow} disabled={isRefreshing}>
            {isRefreshing ? "Yenileniyor" : "Simdi yenile"}
          </button>
          <small>{stocks.length} BIST sembolu · {rows.length} fiyat kaydi</small>
          <small>30 sn otomatik yenileme · {lastUpdated ? lastUpdated.toLocaleTimeString("tr-TR") : "bekleniyor"}</small>
        </div>
      </section>

      <img
        key={refreshAnimationKey}
        className="refresh-character"
        src={refreshCharacter}
        alt=""
        aria-hidden="true"
      />

      <section className="workspace">
        <aside className="search-panel">
          <section className="watchlist-card" id="watchlist">
            <div className="watchlist-title">
              <span>Izleme listesi</span>
              <button type="button" onClick={() => toggleWatchlist(symbol)}>
                {watchlist.includes(symbol) ? "Favoriden cikar" : "Favoriye ekle"}
              </button>
            </div>
            <div className="watchlist-items">
              {watchlist.length ? watchlist.map((watchSymbol) => {
                const item = stocks.find((stock) => stock.symbol === watchSymbol) || { symbol: watchSymbol, code: toCode(watchSymbol), name: toCode(watchSymbol) };
                return (
                  <button
                    type="button"
                    key={watchSymbol}
                    onClick={() => {
                      setQuery(item.code);
                      setSymbol(item.symbol);
                    }}
                  >
                    <span className="symbol-line">
                      <StockLogo stock={item} size="sm" />
                      <strong>{item.code}</strong>
                    </span>
                    <span>{Number.isFinite(item.quote?.change) ? formatPercent(item.quote.change) : "BIST"}</span>
                  </button>
                );
              }) : <p>Favori hisse yok.</p>}
            </div>
          </section>

          <section className="technical-card" id="technical-leaders">
            <div className="watchlist-title">
              <span>90+ trend puani</span>
              <strong>{technicalLeaders.length}</strong>
            </div>
            <div className="technical-items">
              {technicalLeaders.length ? technicalLeaders.map((item) => (
                <button
                  type="button"
                  key={item.symbol}
                  onClick={() => {
                    setQuery(item.code);
                    setSymbol(item.symbol);
                  }}
                >
                  <span className="symbol-line">
                    <StockLogo stock={item} size="sm" />
                    <span>
                      <strong>{item.code}</strong>
                      <small>RSI {Number.isFinite(item.quote?.rsi) ? item.quote.rsi.toFixed(1) : "-"}</small>
                    </span>
                  </span>
                  <em>{item.quote.technicalScore}</em>
                </button>
              )) : <p>90 ustu trend puanli hisse bulunamadi.</p>}
            </div>
          </section>

        </aside>

        <section className="main-panel">
          <div className="stock-head">
            <div>
              <span className="label">Aktif hisse</span>
              <div className="stock-title-row">
                <StockLogo stock={selectedStock} size="lg" />
                <h2>{selectedStock.code || toCode(symbol)}</h2>
                <button type="button" onClick={() => toggleWatchlist(symbol)}>
                  {watchlist.includes(symbol) ? "★" : "☆"}
                </button>
              </div>
              <p>{selectedStock.name}</p>
            </div>
            <div className="price-box">
              <strong>{formatMoney(analysis.latest.close)}</strong>
              <span className={analysis.dailyChange >= 0 ? "positive" : "negative"}>{formatPercent(analysis.dailyChange)}</span>
            </div>
          </div>

          <div className="metrics-grid">
            <article><span>Gunluk Acilis</span><strong>{formatMoney(analysis.latest.open)}</strong></article>
            <article><span>En Yuksek / Dusuk</span><strong>{formatMoney(analysis.latest.high)} / {formatMoney(analysis.latest.low)}</strong></article>
            <article><span>Ort. Hacim</span><strong>{formatCompact(analysis.avgVolume)}</strong></article>
            <article><span>Donem Getirisi</span><strong className={analysis.periodChange >= 0 ? "positive" : "negative"}>{formatPercent(analysis.periodChange)}</strong></article>
          </div>

          <section className="portfolio-card" id="portfolio">
            <div className="panel-title">
              <div>
                <span className="label">Yatirim simulasyonu</span>
                <h3>Sanal portfoy</h3>
              </div>
              <button
                className="collapse-button"
                type="button"
                aria-expanded={isPortfolioOpen}
                aria-controls="portfolio-content"
                onClick={() => setIsPortfolioOpen((value) => !value)}
              >
                {isPortfolioOpen ? "Kapat" : "Ac"}
              </button>
            </div>

            {isPortfolioOpen ? (
              <div className="portfolio-content" id="portfolio-content">
            <form className="investment-form" onSubmit={addInvestment}>
              <label>
                {selectedStock.code || toCode(symbol)} icin yatirilacak tutar
                <input
                  value={investmentAmount}
                  onChange={(event) => setInvestmentAmount(event.target.value)}
                  inputMode="decimal"
                  placeholder="Orn. 10000"
                />
              </label>
              <label>
                Not
                <input
                  value={investmentNote}
                  onChange={(event) => setInvestmentNote(event.target.value)}
                  placeholder="Orn. uzun vade"
                />
              </label>
              <label>
                Stop-loss
                <input
                  value={stopLossInput}
                  onChange={(event) => setStopLossInput(event.target.value)}
                  inputMode="decimal"
                  placeholder="Orn. 280"
                />
              </label>
              <label>
                Hedef fiyat
                <input
                  value={targetPriceInput}
                  onChange={(event) => setTargetPriceInput(event.target.value)}
                  inputMode="decimal"
                  placeholder="Orn. 360"
                />
              </label>
              <button type="submit">Sanal yatirim ekle</button>
            </form>

            <div className="portfolio-summary">
              <article>
                <span>Toplam Yatirim</span>
                <strong>{formatMoney(investmentSummary.invested)} TL</strong>
              </article>
              <article>
                <span>Guncel Deger</span>
                <strong>{formatMoney(investmentSummary.current)} TL</strong>
              </article>
              <article>
                <span>Kar / Zarar</span>
                <strong className={investmentSummary.profit >= 0 ? "positive" : "negative"}>
                  {formatMoney(investmentSummary.profit)} TL
                </strong>
              </article>
              <article>
                <span>Getiri</span>
                <strong className={investmentSummary.profit >= 0 ? "positive" : "negative"}>
                  {investmentSummary.invested > 0 ? formatPercent((investmentSummary.profit / investmentSummary.invested) * 100) : "-"}
                </strong>
              </article>
            </div>

            {activeAlerts.length ? (
              <div className="alert-list" role="status">
                {activeAlerts.map((investment) => {
                  const currentPrice = getCurrentPrice(investment);
                  const stopHit = Number.isFinite(investment.stopLoss) && currentPrice <= investment.stopLoss;
                  return (
                    <p key={`${investment.id}-alert`}>
                      <strong>{investment.code}</strong> {stopHit ? "stop-loss seviyesine geldi" : "hedef fiyat seviyesine geldi"}.
                    </p>
                  );
                })}
              </div>
            ) : null}

            <div className="investment-list">
              {investments.length ? investments.map((investment) => {
                const currentPrice = getCurrentPrice(investment);
                const currentValue = investment.shares * currentPrice;
                const profit = currentValue - investment.amount;
                const profitPercent = (profit / investment.amount) * 100;

                return (
                  <article className="investment-row" key={investment.id}>
                    <div>
                      <strong>{investment.code}</strong>
                      <span>{investment.name}</span>
                      <small>{formatDate(investment.createdAt)}</small>
                    </div>
                    <dl>
                      <div><dt>Yatirim</dt><dd>{formatMoney(investment.amount)} TL</dd></div>
                      <div><dt>Alis</dt><dd>{formatMoney(investment.buyPrice)}</dd></div>
                      <div><dt>Guncel</dt><dd>{formatMoney(currentPrice)}</dd></div>
                      <div><dt>Stop / Hedef</dt><dd>{formatMoney(investment.stopLoss)} / {formatMoney(investment.targetPrice)}</dd></div>
                      <div>
                        <dt>Kar / Zarar</dt>
                        <dd className={profit >= 0 ? "positive" : "negative"}>{formatMoney(profit)} TL · {formatPercent(profitPercent)}</dd>
                      </div>
                    </dl>
                    <label className="investment-note">
                      Not
                      <input
                        value={investment.note || ""}
                        onChange={(event) => updateInvestment(investment.id, { note: event.target.value })}
                        placeholder="Not ekle"
                      />
                    </label>
                    <button type="button" onClick={() => removeInvestment(investment.id)}>Sil</button>
                  </article>
                );
              }) : (
                <p className="empty-portfolio">Henuz sanal yatirim eklenmedi.</p>
              )}
            </div>
              </div>
            ) : null}
          </section>

          <section className="chart-card" id="chart">
            <div className="panel-title">
              <div>
                <span className="label">Detayli grafik</span>
                <h3>Mum grafik, hacim ve 20 gunluk ortalama</h3>
              </div>
              <div className="zoom-controls" aria-label="Grafik yakinlastirma">
                <button type="button" onClick={() => setZoom((value) => Math.max(1, value - 0.4))}>-</button>
                <span>{zoom.toFixed(1)}x</span>
                <button type="button" onClick={() => setZoom((value) => Math.min(6, value + 0.4))}>+</button>
              </div>
            </div>

            <div className="date-controls">
              <label>Baslangic<input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
              <label>Bitis<input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
              <button type="button" onClick={() => { setFromDate(""); setToDate(""); setZoom(1.4); }}>Sifirla</button>
            </div>

            <StockChart rows={rows} zoom={zoom} fromDate={fromDate} toDate={toDate} investments={investments} activeSymbol={symbol} />
          </section>

          <section className="news-card" id="news">
            <div className="panel-title">
              <div>
                <span className="label">Haberler ve KAP</span>
                <h3>{selectedStock.code || toCode(symbol)} duyuru kaynaklari</h3>
              </div>
              <small>Dis kaynak</small>
            </div>
            <div className="news-links">
              <a href={`https://www.kap.org.tr/tr/bildirim-sorgu?search=${encodeURIComponent(selectedStock.code || toCode(symbol))}`} target="_blank" rel="noreferrer">
                KAP bildirimlerinde ara
              </a>
              <a href={`https://tr.tradingview.com/symbols/BIST-${selectedStock.code || toCode(symbol)}/news/`} target="_blank" rel="noreferrer">
                TradingView haberleri
              </a>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(`${selectedStock.code || toCode(symbol)} KAP haber`)}`} target="_blank" rel="noreferrer">
                Web haber aramasi
              </a>
            </div>
          </section>

          <section className="financial-card" id="financials">
            <div className="panel-title">
              <div>
                <span className="label">Finansal degerler</span>
                <h3>TradingView temel metrikleri</h3>
              </div>
              <small>{fundamentalSource}</small>
            </div>
            <div className="financial-grid">
              {Object.entries(fieldLabels).map(([key, label]) => {
                const value = fundamentals?.[key];
                const isPercent = ["dividendYield", "roe", "roa", "debtToEquity"].includes(key);
                const isLarge = ["marketCap", "ev", "revenue", "netIncome"].includes(key);
                const formattedValue = Number.isFinite(value)
                  ? isLarge ? formatCompact(value) : isPercent ? `${formatMoney(value)}%` : formatMoney(value)
                  : "-";
                return (
                  <article key={key}>
                    <span>{label}</span>
                    <strong>{formattedValue}</strong>
                  </article>
                );
              })}
            </div>
          </section>
        </section>

        <aside className="analysis-panel" id="analysis">
          <div className={`signal-card signal-${analysis.action.toLowerCase()}`}>
            <span>Model sinyali</span>
            <strong>{analysis.action}</strong>
            <div className="score-track"><i style={{ width: `${analysis.score}%` }} /></div>
            <small>{analysis.score}/100 teknik + temel puan</small>
            <small>Finansal katki: {analysis.financialImpact >= 0 ? "+" : ""}{analysis.financialImpact}</small>
            {analysis.missingFinancialPenalty ? (
              <small>Eksik finansal veri etkisi: {analysis.missingFinancialPenalty}</small>
            ) : null}
            <div className={`forecast-chip ${analysis.forecastDirection === "Pozitif" ? "forecast-positive" : analysis.forecastDirection === "Negatif" ? "forecast-negative" : "forecast-neutral"}`}>
              <span>{formatShortDate(analysis.forecastSessionDate)} seansi</span>
              <b>{analysis.forecastDirection} egilim</b>
              <small>Aralik: {formatMoney(analysis.forecastLow)} - {formatMoney(analysis.forecastHigh)}</small>
              <small>Guven: {analysis.forecastConfidence}</small>
            </div>
            <div className="external-score">
              <span>TradingView trend puani</span>
              <b>{Number.isFinite(selectedStock.quote?.technicalScore) ? `${selectedStock.quote.technicalScore}/100` : "-"}</b>
            </div>
          </div>

          <div className="decision-list">
            <article><span>Ne zaman alinir?</span><strong>{analysis.buyZone}</strong></article>
            <article><span>Ne zaman satilir?</span><strong>{analysis.sellZone}</strong></article>
            <article><span>Destek Bolgesi</span><strong>{formatZone(analysis.supportZone)}</strong></article>
            <article><span>Direnc Bolgesi</span><strong>{formatZone(analysis.resistanceZone)}</strong></article>
            <article><span>RSI / Volatilite</span><strong>{analysis.rsi.toFixed(1)} / {analysis.volatility.toFixed(2)}%</strong></article>
            <article><span>MA20 / MA50</span><strong>{formatMoney(analysis.ma20)} / {formatMoney(analysis.ma50)}</strong></article>
          </div>

          <div className="reason-box">
            <h3>Hesaplama ozeti</h3>
            {analysis.reasons.map((reason) => (
              <article key={reason.title}>
                <span>{reason.title}</span>
                <p>{reason.text}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>

    </main>
  );
}
