# Rabbit Hole: styrning under fall (designnotis)

UTKAST till PR #42. Bygger på `design-styrmotor-vansterhoger.md`: relativa axlar, inte skärmens «upp». All data i spelet är SIMULERAD eller VERKLIG · HISTORISK. Utbildning, inga riktiga order.

## 1. Princip: «upp» är inte fast

Kaninen faller längs schaktet. Världens lodräta axel är färdriktningen. Styrning ska kännas som andra spel (WASD + kamera), men **framåt = längs fallet**, inte skärmens uppåt.

| Intent (motor) | Spelarkänsla | Under fall |
|---|---|---|
| FORWARD | Framåt / gas | Snabbare fall (högre falltempo / hävstångssteg upp) |
| BACKWARD | Bakåt / broms | Långsammare fall (lägre tempo / hävstångssteg ner) |
| STEER_HIGH / STEER_LOW | Sidledes | Ett steg SÄLJ ↔ FLAT ↔ KÖP |
| JUMP / CONFIRM | Hoppa / bekräfta | Ovan jord: hoppa ned. Under fall: oförändrat (eller FLAT via mellanslag enligt befintlig regel) |

Orienteringen vrider axlarna så att pilarna och WASD alltid mappar till samma *intent*, oavsett om spelet är vågrätt (Trade Rider) eller lodrätt (Rabbit Hole).

## 2. Tangentbord (1P, Rabbit Hole)

**Ovan jord (home):** A/D (eller ←/→) = sidosteg SÄLJ/FLAT/KÖP före hopp. Enter eller «Hoppa ned» = start. Shift+Enter = lokal 2P.

**Under fall (Form A — rekommenderat default):**

| Tangent | Intent | Effekt |
|---|---|---|
| W eller ↑ | FORWARD | Falltempo / hävstång + |
| S eller ↓ | BACKWARD | Falltempo / hävstång − |
| A eller ← | STEER mot SÄLJ | Ett steg vänster i sidospåret |
| D eller → | STEER mot KÖP | Ett steg höger i sidospåret |
| Mellanslag | FLAT | Centrera sidospår (befintlig regel) |

Konflikt: pilar vinner över WASD-alias om båda trycks (samma som styrmotorn). Ett steg per tryck med debounce; reducerad rörelse respekteras.

**2P lokalt (oförändrad uppdelning, samma relativa logik):**
- Spelare 1: WASD + mellanslag
- Spelare 2: pilar + 0 (FLAT)

## 3. Gamepad (förslag)

| Input | Intent |
|---|---|
| Vänster spak Y framåt | FORWARD (falltempo +) |
| Vänster spak Y bakåt | BACKWARD (falltempo −) |
| Vänster spak X / D-pad vänster–höger | STEER SÄLJ ↔ KÖP |
| A / kryss | Hoppa ned (home) / FLAT under fall |
| Höger spak X | Valfri SECOND-axel senare (skydd m.m., se styrmotor-utkast) — **av** tills `secondAxis` sätts |

Deadzone och samma debounce som tangent. Vibrera lätt vid sidosteg och vid max/min falltempo (tillgängligt avstängbart).

## 4. Kamera under fall

**Default: chase längs schaktet.** Kameran sitter bakom/ovan kaninen och tittar **ned längs färdriktningen** (schaktets axel). «Upp» på skärmen är alltså bakåt längs fallet; «ner» på skärmen är framåt. Det matchar Form A: W/↑ = neråt i bilden = snabbare fall.

- Liten lerp så sidosteg syns som en mild roll/pan, inte som fri look.
- Ingen fri mouselook i v1 (håller utbildningsfokus på sidospår + tempo).
- Reduced motion: ingen jump-anim; kamera fast i schaktvy utan lerp.
- 2P: delad schaktvy (split) med samma kameralogik per halvbild, eller en gemensam kamera med två markörer — behåll nuvarande split om den redan finns i #42.

**Alternativ (senare):** «cockpit» tittar rakt ner (kanin i nederkant). Kräver spegling av styraxeln så A fortfarande = vänster i sidospåret.

## 5. Vad som *inte* ändras i #42 utan ja

- Gränslandet: frys fall + tre val oförändrat.
- Simulerad prisclaim på kortet och under fall.
- Nätverkad multiplayer (ute).
- SECOND-axel (Q/E / höger spak) — bara beredskap, av som default.

## 6. Öppna beslut

1. Bekräfta Form A (W/↑ = snabbare fall, A/D = sidospår) som default under fall?
2. Ska höger alltid = KÖP (högre pris) i Rabbit Hole?
3. Läggs notisen in i PR #42 som `docs/` eller `school/`-fil, eller räcker lokal fil tills nästa agentvarv?

## 7. Beslut i den här prototypen

Form A är default. Höger är högre pris och KÖP. Notisen ligger här, `traderider/app/docs/rabbit-hole-styrning-fall.md`.

Bollingerbanden (period 20, k = 2, populationsspridning, samma stängningar som `quote.candles`) är gränsen mellan tunnel och hål, både i bilden och i sidospåret. Innanför övre och undre band är tunneln. På kanten står kaninen när sidan är KÖP eller SÄLJ. Utanför kanten är hålet. Övre bandet är den högra väggen, KÖP. Undre bandet är den vänstra väggen, SÄLJ. FLAT är mitten av tunneln. Prispunkten följer %B: vid bandet eller strax utanför syns ett märke, inte ett spår varje tick.

RSI(14), överköpt 70 och översålt 30, och MACD(12, 26, 9) är jämförelsetal på samma serie. De ritas inte som väggar. RSI-märket syns när zonen går över 70 eller under 30. MACD-märket syns när histogrammet byter tecken. KÖP-märket på höger kant och SÄLJ-märket på vänster kant ligger kvar.

Handkontroll: första spelkontrollen följer Form A för spelare 1. En andra kontroll styr spelare 2 när schaktet är delat. Pilarna gör redan samma sak för spelare 2. Ingen vibration i den här omgången. Ingen SECOND-axel. Ingen nätverkad multiplayer.
