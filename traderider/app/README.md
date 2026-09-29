# Traderider practice demos

Three practice modes for kapitalstrategi.com. Historical NVDA hours, a fictional balance in USD, and no brokerage connection in the demo build.

Pages, served by GitHub Pages:

- `/traderider/demo/` overview
- `/traderider/demo/tag/` NVDA Rider (train on Bollinger rails)
- `/traderider/demo/akademin/` lessons
- `/traderider/demo/raket/` rocket

> **Spärrad variant (tills vidare).** Ägaren har stängt demoramen under `/traderider/demo/` (pixeltåget med konduktörsporträtt, 20-SMA-mittfilen, «Övningskapital (sim.)», «Alla lägen»). Alla fyra ingångarna ovan är nu enkla omdirigeringar till `/nvda-rider/` (`scripts/nvda-rider-redirect.html`). `npm run build:demo` skriver över dem med samma omdirigering efter bygget (`REDIRECTED_TO_NVDA_RIDER` i `vite.demo.config.ts`), och `scripts/check-demo.mjs` fallerar om någon ingång inte är omdirigeringen. Källkoden och de byggda bundlarna ligger kvar men laddas inte av någon sida. Öppna inte ett läge igen utan ägarens uttryckliga ja.

The existing `/nvda-rider/` page is unchanged. Trade Rider can keep embedding it.

```bash
npm install
npm test
npm run build:demo
```

`npm run build:demo` writes `../demo/` and checks that the built files do not reference a brokerage proxy.
