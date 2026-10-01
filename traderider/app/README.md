# Traderider practice demos

Three practice modes for kapitalstrategi.com. Historical NVDA hours, a fictional balance in USD, and no brokerage connection in the demo build.

Pages, served by GitHub Pages:

- `/traderider/demo/` overview
- `/traderider/demo/tag/` NVDA Rider (train on Bollinger rails)
- `/traderider/demo/akademin/` lessons
- `/traderider/demo/raket/` rocket

> **Spärrad demoram (permanent).** Ägaren har stängt demoramen i `src/demo/` för gott. Ingångarna under `/traderider/demo/` är enkla omdirigeringar (`scripts/demo-redirects.json`, mall `scripts/demo-redirect.html`): översikten till `/traderider/`, `tag/` till `/traderider/spel/#nvda-rider`, `raket/` till `/traderider/spel/#raket` och `akademin/` till `/traderider/spel/#akademin`. `npm run build:demo` skriver över ingångarna med omdirigeringarna och tar bort de byggda bundlarna (`DEMO_REDIRECTS` i `vite.demo.config.ts`); `scripts/check-demo.mjs` fallerar om något annat än omdirigeringarna finns kvar i `../demo/` eller om ramens texter dyker upp där. De nya lägena (NVDA Rider, Raket, Akademin) ligger i `/traderider/spel/` och bygger inte på den här appen. Öppna inte demoramen igen. Dokumentationen för den spärrade varianten ligger i `docs/` här (följer inte med till Pages).

The existing `/nvda-rider/` page is unchanged. Trade Rider can keep embedding it.

```bash
npm install
npm test
npm run build:demo
```

`npm run build:demo` writes `../demo/` and checks that the built files do not reference a brokerage proxy.
