# BIST Terminal

<img width="1024" height="1536" alt="ChatGPT Image 18 Haz 2026 12_56_54" src="https://github.com/user-attachments/assets/ed7b7cad-2f98-482d-bc5c-5ab6a8206cbc" />

Borsa İstanbul hisselerini teknik ve finansal verilerle incelemek için geliştirilmiş yerel bir React uygulamasıdır.

Uygulama; hisse arama, mum grafik, destek/direnç analizi, finansal değerlendirme, model sinyali, hedef fiyat ve sanal portföy özelliklerini tek ekranda sunar.

> Bu proje yatırım tavsiyesi vermez. Üretilen sinyaller, hedef fiyatlar ve tahminler yalnızca bilgilendirme ve kişisel analiz amaçlıdır.

## Özellikler

- Borsa İstanbul hisse listesi ve arama
- 30 saniyede bir otomatik veri yenileme
- Manuel yenileme
- Mum grafik, hacim ve MA20
- Grafik yakınlaştırma ve geçmişte gezinme
- Yatay seviye ve trend çizgisi araçları
- Hisse bazında kalıcı grafik çizimleri
- Detaylı destek ve direnç bölgeleri
- RSI, volatilite, momentum ve risk/ödül analizi
- Finansal kalite değerlendirmesi
- Model sinyali: `AL`, `BEKLE`, `SAT`
- 8-12 haftalık model hedef fiyatı ve stop seviyesi
- İzleme listesi
- 90+ trend puanlı hisseler
- Alım alanı adayları
- Sanal yatırım ve portföy simülasyonu
- Not, stop-loss ve hedef fiyat alarmı
- KAP ve haber bağlantıları

## Veri Kaynakları

- **TradingView Scanner:** BIST hisse listesi, son fiyat, teknik göstergeler ve finansal metrikler
- **Yahoo Finance:** Günlük fiyat geçmişi ve grafik verisi
- **Yerel cache:** Yahoo verisi alınamadığında daha önce kaydedilmiş fiyat geçmişi

TradingView ve Yahoo Finance üçüncü taraf servislerdir. Servislerdeki değişiklikler, erişim kısıtlamaları veya eksik veriler uygulamanın bazı bölümlerini etkileyebilir.

## Kullanılan Teknolojiler

- React 19
- Vite 7
- JavaScript
- CSS
- Node.js tabanlı yerel API proxy
- LocalStorage ve JSON dosyaları

## Kurulum

Gereksinimler:

- Node.js 20 veya üzeri
- npm

Projeyi kurmak için:

```bash
npm install
npm run build
```

## Çalıştırma

Yalnızca kendi bilgisayarında çalıştırmak için:

```bash
npm run dev
```

Ardından tarayıcıdan aç:

```text
http://127.0.0.1:5173/
```

`npm run dev` bu projede Vite preview sunucusunu çalıştırır. Kaynak kod değişikliklerinden sonra güncel çıktıyı görmek için yeniden build alınmalıdır:

```bash
npm run build
```

## Yerel Ağda Kullanım

Aynı Wi-Fi veya yerel ağdaki diğer cihazlardan erişmek için:

```bash
npm run build
npm run lan
```

Diğer cihazdan bilgisayarın yerel IP adresini kullan:

```text
http://BILGISAYAR_IP_ADRESI:5173/
```

Windows Güvenlik Duvarı bağlantıya izin vermelidir.

## Veri Saklama

Uygulama aşağıdaki verileri kalıcı olarak saklar:

- Sanal yatırımlar: `data/investments.json`
- Fiyat geçmişi cache'i: `data/history-cache.json`
- Seçili hisse, favoriler ve grafik çizimleri: tarayıcı `localStorage`

Proje kapatılıp yeniden açılsa bile bu veriler korunur. Tarayıcı verileri temizlenirse favoriler ve grafik çizimleri silinebilir.

## Model Sinyali

Model sinyali iki ana bileşenden oluşur:

- Finansal araştırma: `%62`
- Teknik zamanlama: `%38`

Finansal analizde değerleme, kârlılık, büyüme, bilanço dayanıklılığı ve nakit üretimi değerlendirilir. Teknik tarafta trend, RSI, momentum, volatilite, hacim ve destek/direnç konumu kullanılır.

Hedef fiyat; finansal kalite, teknik görünüm, ATR oynaklığı ve direnç bölgelerinden türetilen tahmini bir değerdir. Kâr garantisi değildir.

## Proje Yapısı

```text
.
|-- data/
|   |-- history-cache.json
|   `-- investments.json
|-- src/
|   |-- assets/
|   `-- App.jsx
|-- index.html
|-- styles.css
|-- vite.config.js
`-- package.json
```

## Uyarı

Bu yazılım:

- Bir yatırım danışmanlığı hizmeti değildir.
- Gerçek zamanlı ve lisanslı piyasa veri terminali değildir.
- Emir göndermez veya aracı kurum hesabına bağlanmaz.
- Finansal kayıp riskini ortadan kaldırmaz.

Yatırım kararlarından önce verileri resmi kaynaklardan doğrulayın ve kendi risk değerlendirmenizi yapın.

