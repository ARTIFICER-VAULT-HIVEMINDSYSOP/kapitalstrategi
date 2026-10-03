# Gränslandet

Gränslandet är övergången från den historiska banan till verkliga kurser. Det är en delad kärna för Trade Rider, RaceX, Trade Rider Academy och Rabbit Hole. Det är ingen shop och det lägger inga order.

## Flöde

1. Historisk bana. Verkliga historiska kurser, märkta VERKLIG · HISTORISK. Banorna slumpas inte.
2. Loppet tar slut. Sista ljuset fryses. Valet syns direkt: Gå in i riktiga kurser, Spela historien igen, Tillbaka till menyn.
3. Live. Samma diagram fortsätter med verkliga kurser fram till nu, och sedan med nya kurser när de kommer. Spelaren ser bara data fram till nu. Under hämtningen står det Hämtar verkliga värden … och inga påhittade siffror visas.
4. Två spelare delar skärmen och läser samma verkliga data. Var och en har egna simulerade val.

Pengarna i livefasen är simulerade. Etiketten är Simulerade pengar. Ett bra resultat i spelet ger ingen garanti på marknaden, där du kan förlora pengar.

## Kod

Kärnan ligger i `traderider/spel/gransland/`.

- Fasmaskin: historia → gransland → live.
- Porten `attachLiveFeed` i `traderider/spel/lagen/live-port.js` återanvänds när verklig data har kommit in.
- Adaptrar för Coinbase, Kraken och Yahoo.
- Skarv på tidsstämpel. Luckor, till exempel stängd börs eller helg, ritas som luckor och fylls inte med påhittade värden.
- Färskhetskontroll. För gammal eller utebliven data märks OKÄND, utan siffror, med valen Byt till krypto (dygnet runt) och Spela igen.
- Indikatorerna RSI, MACD, Bollinger, SMA, EMA och ATR räknas i webbläsaren med samma funktioner för historik och live. RSI är Wilder period 14 från den historiska banan. Bollinger är period 20 och k = 2 med populationens standardavvikelse.

Varje variant har en tunn krok:

- Trade Rider: `panel.js` och `duo.js`
- RaceX: `raket.js`
- Trade Rider Academy: `akademin.js`
- Rabbit Hole: `rabbit.js`

## Data

Krypto, BTC-USD, hämtas i webbläsaren från Coinbase Exchange publika ticker och candles. Kraken är reserv om Coinbase inte svarar. Inget konto och ingen nyckel. Anropen går långsamt, ungefär var 45:e sekund, och backar av vid fel.

Aktier och index går bara genom Cloudflare-Workern i `worker/gransland-data/`. Workern har cache i 120 sekunder, en fast instrumentlista, exponentiell backoff och CORS begränsad till kapitalstrategi.com och localhost. Den är inte deployad. `WORKER_URL` i `traderider/spel/gransland/config.js` är null, så aktier visas som OKÄND tills adressen sätts.

Instrumentlistan är ett förslag i `traderider/spel/gransland/instruments.js`: Volvo B, Ericsson B, H&M B, OMXS30, Apple, en USA-aktie och Bitcoin. Daniel har inte beslutat listan.

## Vad som fungerar utan Worker

- Historisk bana, frysning och valet efter loppet.
- Live på Bitcoin när webbläsaren når Coinbase eller Kraken.
- Simulerade val mot den verkliga Bitcoin-kursen.
- OKÄND för aktier, utan nätanrop, så länge `WORKER_URL` är null.

## Vad som kräver att Workern deployas

- Aktier och index från Yahoo chart v8.
- Reservväg för krypto om webbläsaren inte får läsa börsernas API.

Deploy ska inte göras förrän det finns ett Cloudflare-konto och Daniel har sagt ja. Inga konton eller nycklar skapas i det här utkastet.

## Öppet

- D2. Vilka instrument som ska gälla. Listan är ett förslag.
- Ett 24-timmarstest av Yahoo från en riktig Worker. Det kräver Cloudflare-konto och Daniels ja.
- Legal. Yahoos villkor, och visningsvillkoren för Coinbase och Kraken, innan något blir publikt.
