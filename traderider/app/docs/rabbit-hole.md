# Rabbit Hole

Visuell riktning för läget `#rabbit-hole`. Samma styrmotor som de andra lägena. Kaninen faller ned i ett schakt. Gränslandet ligger kvar längst ned. Styrning och Bollinger som gräns mellan tunnel och hål: [rabbit-hole-styrning-fall.md](rabbit-hole-styrning-fall.md).

## Start

Kaninen börjar ovanför hålet, med en kort ruta på gräset. Enter eller knappen Hoppa ned börjar fallet. Skift+Enter eller Två spelare delar schaktet lokalt: spelare 1 använder WASD och mellanslag, spelare 2 pilar och 0. Under fallet syns fallfart, sidläge och beslutet SÄLJ, FLAT eller KÖP. `prefers-reduced-motion` hoppar över hoppet och håller spiralen stilla. Gränslandet fryser fallet och visar de tre valen.

## Rörelse

Världen rullar uppåt förbi kaninen. Det läses som ett fall nedåt, inte som flykt uppåt. Form A: W eller pil upp ökar farten nedåt. S eller pil ned bromsar. A eller pil vänster stegar mot SÄLJ. D eller pil höger stegar mot KÖP. Mellanslag är FLAT. Kameran följer fallet med en liten sidoförskjutning. Höger vägg är det övre Bollingerbandet och vänster vägg är det undre, på samma stapelserie som priset. Mellan banden är tunneln. Utanför är hålet. KÖP står på den högra kanten och SÄLJ på den vänstra. RSI och MACD är jämförelsetal, med ett märke när de faktiskt säger något. En handkontroll kan styra spelare 1, en andra spelare 2, lokalt. Högre hävstång kan ge större vinst men också större förlust.

Morot betyder stigande stapel. Chili betyder fallande stapel. En morot som träffar kaninen ger en liten +HP. Skyltar med RSI och MACD följer med fallet. Inga tickersymboler och ingen batterilogotyp.

`prefers-reduced-motion` stannar spiral, virvel och parallax.

## Referenser

Fem källor. Bara det som listas här används. Inget av referensbilderna ligger i repot.

1. **ref-1, Rabbit Hole-schaktet.** Bidrar med fallet ned i ett mörkt schakt, neonrosa och turkos, morötter och chili runt kaninen, solglasögon med röd båge och en ljus glans i varje lins, långa öron och ett batteri i famnen. Batteriet på bilden har en logotyp. Spelet ritar ett neutralt batteri utan text.
2. **ref-2, spiralvirveln.** Bidrar med virveln och djupet, skyltar i samma anda som MACD och RSI längs fallet, och styrningen: W djupare och snabbare, S långsammare fall, A vänster, D höger. Kaninen dyker med huvudet före.
3. **ref-4, morot och +HP.** Bidrar med två tydliga linser på ansiktet, rosa nos, rosa kinder, en mun som äter, moroten som ger +HP, och den rosa-turkosa virveln. Bågen kan vara mörk just när kaninen äter.
4. **John Tenniel, 1865, den vita kaninen.** Public domain. Bidrar med långa upprätta öron, ett huvud som är skilt från kroppen, armar och ben, och motivet att falla ned i ett kaninhål. Filmversionen är inte en källa.
5. **Lisebergs vita kanin, inklusive Julius, bara som lös stilimpuls.** Bidrar med vit päls, stora vänliga öron, tecknade proportioner och något framför ögonen. Rock, krage, färgkombination och namn kopieras inte och står inte i sajttexten.

## Bildruta

Bildrutan är 256×224 och skalas med ett heltalssteg, närmaste granne, så att pixlarna hålls jämna. Färgerna ligger på 5 bitar per kanal. Kaninen, moroten och chilin har egna paletter med högst 16 färger. Bakgrunden är 16×16-plattor i tre lager som rör sig olika fort. Schaktets golv är en perspektivsampling som roterar under fallet. Himlen byter färg rad för rad. Vattnet och hålets kant byter palettsteg. En egen bitkarta ritar texterna i bilden. Ljudet är korta vågformer: en slinga ovan jord, en i schaktet, och korta ljud för hopp, morot, KÖP-kanten, SÄLJ-kanten och menyn. Volymen är låg från start och kan stängas av.

`prefers-reduced-motion` stannar blink, skak, palettbyte och perspektivets rotation tillsammans med spiralen.

## Koppling

Samma övning som de andra lägena, med fallet nedåt. Gränslandet är hålets botten.
