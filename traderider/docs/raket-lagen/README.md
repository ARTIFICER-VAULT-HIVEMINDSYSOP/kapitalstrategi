# Raket-lägen (utkast) – körlägen, gas, egen TP/SL, margin call med larm

Övning på riktiga historiska NVDA-timcandles (samma data och samma motor som klassiska Raket: `deskState` + `market` + `bollinger`).
Inga riktiga pengar, ingen rådgivning. Resultat visas i R och i procent av insatsen – aldrig som belopp. Ett drag som ger vinst i
övningen hade lika gärna kunnat gå emot en; det är därför SL och margin call finns med.

Sida: `/traderider/demo/raket/` (direktlänk till ett läge: `?lage=niva|tid|budget|stopp|chock|spoke|klassisk`).
Ingång: `/traderider/` (kortet «Raket»).

## Lägen

| Läge | Mål | Krav | Klarad | Inte klarad |
|---|---|---|---|---|
| **Nå din TP** (`niva`) | Nå din egen TP | TP krävs, SL valfri | TP nådd | SL, margin call, serien slut |
| **Tidsattack** (`tid`) | TP inom 30 candles | som ovan | TP nådd i tid | tiden ute, SL, margin call |
| **Riskbudget** (`budget`) | TP innan 3 R är förbrukade | SL krävs, varje SL kostar 1 R | TP nådd | tredje SL, margin call |
| **Stoppträning** (`stopp`) | SL utanför bruset | SL ≥ 1 band-σ, TP ≥ 2 R | TP nådd | SL, margin call |
| **Stor rörelse** (`chock`) | Seriens största riktiga timdrag (2026-09-14 13:30 UTC, −3,55 %) | Start 8 candles före, riktningen dold tills draget kommit, SL krävs | TP inom 12 candles efter draget | tiden ute, SL, margin call |
| **Spöke** (`spoke`) | Ditt förra varv åker med | som `niva` | TP nådd (bonus om före spöket) | som `niva` |
| **Fri åkning** (`klassisk`) | Klassiska Raket, oförändrad | – | – | – |

Alla lägen utom `chock` startar vid första candle där bandets σ ≤ 2 % av kursen (i den här serien index 33, 2026-08-31),
så att seriens tidiga +7,5 %-hopp inte blåser upp minsta TP-avstånd.

## TP, SL och margin call – tre olika slut

| | Vad händer | Färg | Text |
|---|---|---|---|
| **TP** | Timstängning når TP. Positionen stängs. **TP vinner nivån i alla lägen.** | grön | «Nivå klarad – TP nådd (övning)» + R |
| **SL** | Timstängning når SL. Kontrollerad stängning. Nivån inte klarad (i riskbudget: −1 R, rundan fortsätter). | amber | «Stop-loss nådd – positionen stängd kontrollerat (övning)» |
| **Margin call** | Marginal = eget kapital ÷ insats vid öppning. < 92 % varning, **< 85 % MARGIN CALL**: rött blinkande vinjett (2 Hz), skakning, «⚠ MARGIN CALL», «🔔 LARM», siren (WebAudio, av/på), stor nedräkning 5 s. Ingen paus. Återhämtar sig marginalen över 85 % släpps larmet. **< 75 % eller nedräkning 0 → tvångsstängning.** Stänger du själv (F eller motsatt knapp) under larmet blir det en kontrollerad men sen stängning och rundan fortsätter. | röd | «Margin call – positionen tvångsstängd (övning)» |

Om SL ligger innanför margin call-zonen stänger SL först (kontrollerat), även om nedräkningen redan gått igång.

**Mindre rörelse** (följer `prefers-reduced-motion`, och kan slås på/av med reglage som sparas i localStorage):
ingen skakning, stadigt rött i stället för blink. Text, nedräkning, `role=alert` och ljud finns kvar.

### Tidigare margin call (klassiska Raket, orörd)
`enforceMaintenance` stängde tyst vid underhållsgränsen (long 25 %, short 30 %) med en statusrad – inget larm, ingen nedräkning.
Vid 4× blev positionen likviderad direkt vid första motrörelsen eller spreaden (4 × 25 % = 100 % av eget kapital).
I Raket-lägena är den direktkontrollen avstängd (`enforce = false` i `submitBuy/submitSell`) och ersatt av nedräkningen ovan.
Övriga lägen påverkas inte (standardvärdet är `true`).

## Gas och hävstång

- **Gas** 0–100 % = tempo: 0,25–3 candles/s. Vertikalt reglage på dator, horisontellt på mobil. `E` mer, `Q` mindre (10 %).
- **Hävstång** 1–4× = risk (positionsstorlek). Styr inte längre farten i de här lägena.

## Egen TP/SL

- Ställs före start i en ruta, i **procent** eller **pris** utifrån aktuell riktig NVDA-kurs. Rutan visar TP/SL-priser för både KÖP och SÄLJ och R (TP ÷ SL).
- Priserna räknas från fyllnadskursen när du öppnar. Träff kontrolleras på timstängning.
- Under rundan: `T`/`G` flyttar TP längre/närmare, `Y`/`H` flyttar SL längre/närmare (0,1 % av ingången per tryck), eller dra linjerna med mus/finger.
- **Regler mot fusk:** TP ≥ max(0,8 %, 1 band-σ) från ingången; med SL krävs minst 1,5 R (stoppträning 2 R); under rundan kan TP aldrig flyttas närmare än 0,5 % bortom aktuell kurs; SL alltid på förlustsidan av kursen.

Grafen visar TP (grön), SL (amber, streckad), ingång (vit prickad), tvångsstängningsnivå (röd prickad), spökraket (lila)
och markeringen för det stora timdraget. Linjer utanför bild visas som pil vid kanten med pris.

## Tangenter

| | |
|---|---|
| KÖP | `→` / `D` |
| SÄLJ | `←` / `A` |
| Hävstång | `↑` / `W` / `]` upp · `↓` / `S` / `[` ner · `1`–`4` direkt (max 4×) |
| Platt | `F` |
| Paus | Mellanslag (inte under margin call) |
| Gas | `E` / `Q` |
| TP | `T` längre / `G` närmare |
| SL | `Y` längre / `H` närmare |
| Ny runda | `R` |

KÖP/SÄLJ startar också rundan från inställningsrutan. Tryck motsatt sida för att stänga (ingen automatisk vändning).

## Filer

- `app/src/lib/rocketGame.ts` – ren spellogik (lägen, regler, TP/SL, margin call, gas, spöke, stort drag)
- `app/src/lib/drawRaketSpel.ts` – overlay ovanpå `drawRocket`
- `app/src/lib/rocketAlarm.ts` – siren (WebAudio, 2 Hz tvåton)
- `app/src/lib/raketSpelKeys.ts` – tangentschema
- `app/src/modes/RaketSpel.tsx`, `raketspel.css` – gränssnitt
- `app/src/rocketGame.test.ts` – 12 tester
- `app/src/lib/market.ts` – valfri `enforce`-parameter (standard oförändrat)
- `app/src/demo/DemoFrame.tsx` – `intro={false}` (Raket startar direkt i spelet; teasern spelade en automatisk simulerad affär)
- `demo/` – ombyggd bundle

## Kända brister (utkast)

- Texterna i Raket-lägena finns bara på svenska; EN/UA visar svenska i spelet (menyn och disclaimern följer språket).
- Samma startpunkt varje runda (utom `chock`), och bara en historisk serie (155 timcandles) – spöket och tidsattacken blir därför lätta att lära sig utantill.
- Sirenen kräver en användargest (webbläsarregel); första larmet efter sidladdning utan klick/tangent kan vara tyst.
- Skärmdumparna är tagna med animationer stoppade (vinjetten syns då i «på»-läget).
- Uppskattad kvarvarande byggtid till skarp version: 1–2 dagar (EN/UA-texter, fler startpunkter/serier, ljuddesign, QA på riktiga mobiler).

## Skärmdumpar

Se `shots/` och `kontaktark-*.png`.

- `kontaktark-desktop.png`, `kontaktark-mobil.png` – alla skärmdumpar på ett ark
- `shots/kontroll.json` – vad skriptet mätte i varje scen (fas, marginal, nedräkning, slutorsak, tangenttest, dra TP-linjen)
- `shoot_raket.py` – Playwright-skriptet (kör mot en lokal statisk server på port 8815)

Testat lokalt: `tsc --noEmit`, `vitest run` (57 tester, varav 12 nya), `vite build --config vite.demo.config.ts`, `node scripts/check-demo.mjs`,
samt Playwright på dator 1280×800 och mobil 390×844 utan sidfel.
