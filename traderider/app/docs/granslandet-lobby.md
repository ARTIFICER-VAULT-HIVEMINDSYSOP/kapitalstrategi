# Gränslandet-lobbyn

Gränslandet är övergången från historisk data till live mot en annan spelare. Det är en liten lobby mellan lägena där alla spelare accepterar innan spelet fortsätter. Gränslandet är ingen shop och blandas aldrig med NFT Advisory.

## Beteende

- Efter den historiska banan öppnas lobbyn som en egen scen över hela skärmen. Spelet står stilla bakom. Inga rutor läggs ovanpå spelplanen.
- Varje spelare har en Acceptera-knapp. Stilen följer spelet: runsten i Vikingbåt, rymd i RaceX, orange i Rabbit Hole.
- En accept kan ångras tills alla har accepterat. När alla har accepterat startar live.
- Under väntan färgas den grå historiska linjen om till livefärgen. Etiketten LIVE visas med datakälla och tid (Europe/Stockholm). Utan källa står det «Källa inte ansluten». Inga påhittade kurser ritas.
- Avböj (knappen Tillbaka till historiken eller Esc) eller timeout (60 s som standard) går tillbaka till historiskt läge.

## Tillstånd

```
HIST --enter--> LOBBY(acc P1, acc P2) --alla accept--> LIVE
                 |  accept/unaccept (ångra) stannar i LOBBY
                 +--decline / timeout--> HIST
```

I 1P räcker en accept.

## Modul

`traderider/spel/lagen/granslandet.js` och `granslandet.css`. Modulen har inga importer, gör inga nätanrop och lägger inga order. CSS laddas automatiskt bredvid modulen (`cssHref` kan ändra adressen).

```js
import { enterLobby, accept, unaccept, closeLobby } from '/traderider/spel/lagen/granslandet.js'

enterLobby({
  players: 2,                      // eller [{ name, color }, { name, color }]
  source: { name: 'Coinbase', time: Date.now() },
  history: closes,                 // tal för den grå linjen (valfritt)
  theme: 'default',                // 'default' | 'rune' | 'racex' | 'rabbit'
  lang: 'sv',                      // sv | no | en | uk, labels: {...} skriver över
  timeoutMs: 60000,
  onLive() { /* starta live */ },
  onBack({ reason }) { /* 'decline' | 'timeout' -> tillbaka till historik */ },
})
accept(1); unaccept(1)             // samma som knapparna
```

Tangenter: Spelare 1 = E (eller 1), Spelare 2 = Enter (eller 2), Esc = tillbaka. I 1P fungerar E, Enter och Space. Knapparna är minst 72 px höga och fungerar med touch. Lobbyn är en `role="dialog"` med `aria-modal`, `aria-pressed` på knapparna, en `aria-live`-rad för status och en fokusfälla. `prefers-reduced-motion` stänger av animationerna.

Lager:

1. `createLobbyMachine({ players, timeoutMs, now })`: ren tillståndsmaskin utan DOM.
2. `connectTransport(machine, transport, { localPlayers })`: port för online 2P.
3. `mountLobby(host, opts)` och `enterLobby(opts)`: vyn.

## Online 2P senare

Lokalt 2P på samma skärm fungerar nu. För online behövs en server, och den byggs inte här. Porten är klar:

- `transport = { send(msg), subscribe(fn) }`, meddelanden `{ type: 'accept' | 'unaccept' | 'decline', player }`.
- `enterLobby({ ..., transport, localPlayers: [1] })` gör att skärmen bara styr spelare 1. Spelare 2 kommer in via transporten.
- Servern bör köra samma `createLobbyMachine` och vara auktoritet, så att samtidiga accept och ångra inte kan glida isär. `createLoopbackPair()` visar porten i testerna.

## Var lobbyn sitter

| Iteration | Var | Status |
| --- | --- | --- |
| Trade Rider 1P och 2P (`/traderider/spel/#trade-rider`, `/nvda-rider/` omdirigerar hit) | `faser.js` korset «Gå över gränsen» öppnar lobbyn. `panel.js` skickar antal spelare och tema. | Inkopplad. Korset syns bara när ett live-flöde är anslutet (`live-port.js`), och `liveFeed` är null i dag. |
| RaceX (`#raket`, `#racex`) | Samma `faser.js`, tema `racex`. Ingen ändring i `raket.js`. | Inkopplad, samma villkor som ovan. |
| Rabbit Hole (`#rabbit-hole`) | Samma `faser.js`, tema `rabbit`, 1P. | Inkopplad, samma villkor. |
| Trade Rider Academy / Akademin (`#tra`, `#akademin`) | Samma `faser.js`, 1P. | Inkopplad, samma villkor. |
| Vikingbåt (`/pv/vikingbat/`) | När det historiska racet tar slut och livevarv är på öppnas lobbyn med runstenar. Båda tända ger livevarvet. Avböj eller timeout kör det historiska racet igen. Saknas modulen startar livevarvet som förut. | Inkopplad. |
| Roddtakt (lokal prototyp, inte i repot) | Se nedan. | Krok beskriven. |
| Appen i `traderider/app` (stängd demoram) | `src/live/port.ts` är samma port. | Ingen live-övergång. Inte inkopplad. |
| Förhandsvisning | `/traderider/spel/granslandet.html` visar lobbyn direkt, utan källa. | Ny sida, `noindex`. |

## Roddtakt

Prototypen kan använda modulen utan ändringar i modulen:

```html
<script type="module">
  import * as G from '/traderider/spel/lagen/granslandet.js' // eller en kopia bredvid prototypen
  window.Granslandet = G
</script>
```

När det historiska loppet är slut: frys loppet och anropa

```js
Granslandet.enterLobby({
  players: [{ name: 'Spelare 1', color: '#e8c547' }, { name: 'Spelare 2', color: '#82cdff' }],
  theme: 'rune',
  history: historiskaStängningar,
  source: { name: källnamn, time: Date.now() },
  keys: { 1: ['KeyE'], 2: ['Enter'], solo: ['KeyE', 'Enter'], back: ['Escape'] },
  onLive: startaLiveLopp,
  onBack: startaHistorisktLopp,
})
```

Spelets egna tangentlyssnare ska hoppa över tangenter medan lobbyn är öppen, som i Vikingbåt (`if (gamePhase === 'granslandet') return`). ES-moduler laddas inte från `file://`, så prototypen behöver en lokal server (till exempel `python3 -m http.server`) eller en kopia av modulen.

## Förhållande till PR #41

PR #41 bygger datakärnan i `traderider/spel/gransland/` (källor, skarv, färskhet, Worker). Lobbyn bygger inte om något av det. När #41 landar kopplas lobbyn in där #41 går till live: knappen «Gå in i riktiga kurser» i `gransland/view.js` anropar `enterLobby({ players: snap.players.length, source: { name: snap.source, time: snap.quoteTime }, onLive: () => session.enterReal().then(paint), onBack: leaveToHistory })`. Lobbyn sitter alltså mellan sessionens fas `gransland` och `live`. Ett sådant tillägg är cirka tio rader i `view.js` och görs i den PR som kommer sist av de två.
