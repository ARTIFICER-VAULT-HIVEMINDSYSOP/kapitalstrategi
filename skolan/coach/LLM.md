# Robban och språkmodellen

`COACH_LLM_ENABLED` i `llm-adapter.js` är `false`.

Då svarar Fråga Robban från kurskorten i `kursinnehall.js`. Ingen nyckel behövs, och ingen nyckel finns i repot.

Om flaggan ska slås på senare:

1. Nyckeln läggs som miljövariabeln `COACH_LLM_API_KEY` på en server (till exempel en Worker). Den får inte ligga i repot, i GitHub Pages eller i webbläsaren.
2. Sätt ett utgiftstak hos leverantören innan flaggan blir `true`. Taket ska vara en hård spärr, inte bara en varning.
3. Servern läser nyckeln, skickar `SYSTEM_PROMPT` och använder samma fasta svar när frågan gäller köp, sälj eller vad som passar personen.
4. Byt `COACH_LLM_ENABLED` till `true` först när servern och taket finns. Tills dess faller Robban tillbaka till kurskorten.
