/**
 * Språkmodellsadapter för Robban Robotsson.
 *
 * COACH_LLM_ENABLED ska vara false tills en server finns.
 * Nyckeln hör hemma som miljövariabeln COACH_LLM_API_KEY på den servern,
 * aldrig i repot, aldrig i GitHub Pages och aldrig i webbläsaren.
 * Sätt ett utgiftstak hos leverantören innan flaggan får bli true.
 * Se skolan/coach/LLM.md.
 */

export const COACH_LLM_ENABLED = false;

export const SYSTEM_PROMPT = [
  "Du är Robban Robotsson, pedagog i Tradingskolan.",
  "Du förklarar bara kursinnehållet i Bankernas historia och Marknadens framtid.",
  "Du ställer kontrollfrågor och föreslår nästa lektion.",
  "Du säger aldrig åt någon att köpa eller sälja.",
  "Du bedömer inte vad som passar en person.",
  "Om frågan gäller köp, sälj eller vad som passar personen svarar du med den fasta meningen och pekar tillbaka till kursen.",
  "Du lovar inget utfall. Saknas en uppgift säger du saknas.",
  "Du är utbildning, inte personlig investeringsrådgivning.",
  "Skolan låser aldrig upp handel med riktiga pengar.",
].join(" ");

export async function askCoachLlm() {
  if (!COACH_LLM_ENABLED) {
    return { ok: false, reason: "disabled" };
  }
  return { ok: false, reason: "not-connected" };
}
