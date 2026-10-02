# Processanteckningar (publiceras inte)

Flyttat från den publicerade README så att kunskapen finns kvar utan att ligga på Pages.

Pages-arbetsflödet (`.github/workflows/pages.yml`) laddar upp repot som filer. Det kör inte Jekyll (`jekyll-build-pages` saknas), så en mapp med understreck publiceras om den inte tas bort i steget före uppladdningen. Steget tar bort `traderider/app` och den här mappen.

## Varför en egen mapp och inte `/nvda-rider/`

Öppen PR #25 ändrar `nvda-rider/index.html` och tillgångarna där. Spelet ligger i `traderider/spel/` för att inte krocka, som en kopia med sökvägarna `/nvda-rider` → `/traderider/spel`.

## Bygge och kontroller

- `data/simulerad-kurs.json` genereras av `traderider/app/scripts/simulerad-kurs.mjs` (GBM, frö 20261001, årlig drift 10 %, volatilitet 40 %). Tidsstämplarna är fiktiva.
- `npm run build:demo` i `traderider/app` skriver omdirigeringarna från `scripts/demo-redirects.json`.
- `node --test traderider/app/spel-test/` och `npm test` samt `npm run build:demo`.
- Playwright: `python3 traderider/app/spel-test/verifiera.py`. Resultatet från den körningen ligger i `verifiering.json` i den här mappen.

## Koppling

Kartan för läsaren ligger i den publicerade `koppling.md`. Den här filen är bara arbetsanteckningar.
