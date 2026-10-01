# Traderider: NVDA Rider, Raket och Akademin (utkast)

Tre övningslägen på samma **simulerade kursserie**, på en sida: **`/traderider/spel/`**.
Simulerade kurser – inte verkliga marknadsdata. Namnet NVDA Rider är bara spelets namn; serien är inte NVDA:s kurs.
Inga riktiga pengar, ingen inloggning, ingen mäklare, inga order och inga orderlänkar.

| Adress | Vad |
| --- | --- |
| `/traderider/` | Ingången: tre kort (NVDA Rider, Raket, Akademin). |
| `/traderider/spel/#nvda-rider` | NVDA Rider (startläge). Växeln högst upp byter läge. |
| `/traderider/spel/#raket` | Raket. |
| `/traderider/spel/#akademin` | Akademin: fyra lektioner med utmärkelser. |
| `/traderider/demo/` | Omdirigering till `/traderider/`. |
| `/traderider/demo/tag/` | Omdirigering till `/traderider/spel/#nvda-rider`. |
| `/traderider/demo/raket/` | Omdirigering till `/traderider/spel/#raket`. |
| `/traderider/demo/akademin/` | Omdirigering till `/traderider/spel/#akademin`. |
| `/nvda-rider/` | Oförändrad i den här ändringen (öppen PR #25 ändrar samma filer). |

## Varför en egen mapp och inte `/nvda-rider/`
Öppen PR #25 ändrar `nvda-rider/index.html`, `nvda-rider/assets/routes-CbqPJAI2.js` och `nvda-rider/assets/index-CjseGLmu.js`.
För att inte krocka ligger spelet i `traderider/spel/`, som en kopia av `nvda-rider/` med sökvägarna `/nvda-rider` → `/traderider/spel`.

## Innehåll i `traderider/spel/`
- `data/simulerad-kurs.json`: den enda kursdatan. Deterministisk GBM med växlande drift (frö 20261001, årlig drift 10 %, volatilitet 40 %),
  genererad av `traderider/app/scripts/simulerad-kurs.mjs`. Tidsstämplarna är fiktiva och visas som «Dag N», «Vecka N» eller «Månad N».
  Ingen hämtning från någon extern värd: den gamla API-värden och den bundlade filen med verkliga kurser är borttagna.
- `assets/`, `sprites/`, `og.jpg`, `favicon.svg`: NVDA Rider-bygget från `nvda-rider/` på main, patchat till den simulerade serien
  (texter om verkliga kurser och «live» utbytta, etiketten «Simulerad kurs» på priskortet). `routes-CbqPJAI2.js` har
  läskroken `window.__trEngine`, FLAT-läget och tangentplanen (W/↑ BUY, S/↓ SELL, A/← D/→ hävstång, ␣/0 FLAT, P paus) samt
  **loket vänt rätt**: skorstenen sitter i främre delen av pannan och röken kommer ur skorstenen. Plogen är längst fram och hytten längst bak, i färdriktningen.
- `lagen/`: växeln (`panel.js`, «NVDA Rider | Raket | Akademin», 1P/2P, «← Traderider», helskärmsknapp), Raket (`raket.js`, cyber-HUD),
  Akademin (`akademin.js`, `akademin-logic.js`: fyra lektioner, 9 märken och 4 medaljer, sparas bara i webbläsaren), RSI (`rsi.js`),
  tangentplan (`keys.js`) och 2 spelare för NVDA Rider (`duo.js`).
- `index.html`: laddar `lagen/panel.js`. Frågan efter inloggningssession besvaras lokalt som gäst, så det blir ingen inloggning och ingen 404.
  Dessutom finns en CSS-fix för 390 px så att kursbrickan inte trycks ut, och länken «Sign in» är dold.

Etiketten «Simulerade kurser – inte verkliga marknadsdata» syns under växeln i alla tre lägena och på `/traderider/`.

## Ingen order
Ingenting under `traderider/spel/` kan lägga en order: ingen mäklare, ingen orderadress, inga API-nycklar och inget skarpt läge.
Mäklarpanelen och serverns orderväg är också borttagna ur appkällan i `traderider/app/` (som inte laddas upp).

Helskärm: Fullscreen API (även med webkit-prefix). Där API:t saknas, till exempel i iPhone Safari, låses bara scrollningen, eftersom spelytan redan fyller fönstret.

## Spärrad demoram
De byggda demobundlarna under `traderider/demo/assets/` är borttagna, så ingenting av den gamla demoramen laddas upp till Pages.
`npm run build:demo` (i `traderider/app`) skriver omdirigeringarna från `scripts/demo-redirects.json` och tar bort `assets/`.
`scripts/check-demo.mjs` fallerar om något annat än omdirigeringarna finns kvar eller om ramens texter dyker upp.
Dokumentationen för den spärrade varianten har flyttats till `traderider/app/docs/`, som inte laddas upp.

## Tester
- `node --test traderider/app/spel-test/`: 68 tester för RSI, tangentplan, Raket, Raket-stil, Akademin och utmärkelser, plus statiska kontroller.
  De statiska kontrollerna täcker sökvägar, lokets riktning, växeln, helskärm, att det inte finns någon inloggning, ingången, omdirigeringarna och spärrade ord,
  samt simulerade kurser (serien genereras om exakt från fröet, ingen extern värd, synlig etikett) och att ingen mäklarkod finns kvar.
- `python3 traderider/app/spel-test/verifiera.py <bas-URL> <mapp> <json>`: Playwright i dator 1280×800 och mobil 390×844 mot en lokal
  server som efterliknar GitHub Pages. Se `verifiering.json` här.
- `traderider/app`: `npm test` och `npm run build:demo`.

Testerna ligger i `traderider/app/` eftersom den mappen inte laddas upp till Pages.

## Skärmdumpar
| Dator | Mobil |
| --- | --- |
| ![Ingång dator](01-traderider-desktop.jpg) | ![Ingång mobil](01-traderider-mobil.jpg) |
| ![NVDA Rider dator](02-nvda-rider-desktop.jpg) | ![NVDA Rider mobil](02-nvda-rider-mobil.jpg) |
| ![Raket dator](03-raket-desktop.jpg) | ![Raket mobil](03-raket-mobil.jpg) |
| ![Akademin dator](04-akademin-desktop.jpg) | ![Akademin mobil](04-akademin-mobil.jpg) |
| ![Loket framåt dator](loket-framat-desktop.jpg) | ![Loket framåt mobil](loket-framat-mobil.jpg) |
