# Traderider practice demos

Three practice modes for kapitalstrategi.com. Historical NVDA hours, a fictional balance in USD, and no brokerage connection in the demo build.

Pages, served by GitHub Pages:

- `/traderider/demo/` overview
- `/traderider/demo/tag/` NVDA Rider (train on Bollinger rails)
- `/traderider/demo/akademin/` lessons
- `/traderider/demo/raket/` rocket

The existing `/nvda-rider/` page is unchanged. Trade Rider can keep embedding it.

```bash
npm install
npm test
npm run build:demo
```

`npm run build:demo` writes `../demo/` and checks that the built files do not reference a brokerage proxy.
