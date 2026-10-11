import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { answerCoach, FIXED_REFUSAL } from "./coach/coach.js";
import { COACH_LLM_ENABLED } from "./coach/llm-adapter.js";
import { formatWhen, outcomeSentence } from "./signal-card.js";
import { awardsEarned, levelFromAwardCount, stateForAwards } from "./niva.js";

const root = fileURLToPath(new URL(".", import.meta.url));
const failures = [];

const forbidden = [
  ["riskprofil", /riskprofil/i],
  ["lämplighet", /lämplighet/i],
  ["rådgivare", /rådgivare/i],
  ["vi anser att du förstått riskerna", /vi anser att du förstått riskerna/i],
  ["godkänd för signaler", /godkänd för signaler/i],
  ["redo att handla", /redo att handla/i],
  ["diplom", /\bdiplom/i],
  ["intyg", /\bintyg/i],
  ["certifikat", /certifikat/i],
  ["licens", /licens/i],
  ["ÖB", /\bÖB\b/],
  ["Avanza", /\bAvanza\b/i],
  ["Nordnet", /\bNordnet\b/i],
  ["eToro", /\beToro\b/i],
  ["Saxo", /\bSaxo\b/i],
  ["DEGIRO", /\bDEGIRO\b/i],
  ["Plus500", /\bPlus500\b/i],
  ["Interactive Brokers", /Interactive Brokers/i],
  ["tap to trade", /tap to trade/i],
  ["copy trading", /copy trading|kopiera handel/i],
  ["tidszon", /\b(CET|CEST|UTC|GMT)\b/],
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "check-compliance.mjs" || name === "node_modules") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

const files = walk(root);
const texts = new Map(files.map((path) => [path, readFileSync(path, "utf8")]));

for (const [path, text] of texts) {
  for (const [label, pattern] of forbidden) {
    if (pattern.test(text)) failures.push(`${path}: förbjudet ord «${label}»`);
  }
  const sentences = text.split(/(?<=[.!?;])\s+/);
  for (const sentence of sentences) {
    if (/\bvinst\b/i.test(sentence) && !/\b(risk|förlust)\b/i.test(sentence)) {
      failures.push(`${path}: «vinst» utan risk eller förlust i samma mening`);
    }
  }
}

function mustInclude(rel, phrase) {
  const path = join(root, rel);
  const text = texts.get(path) || "";
  if (!text.includes(phrase)) failures.push(`${rel}: saknar «${phrase}»`);
}

const QUIZ =
  "Kunskapstestet är utformat för att kartlägga dina kunskaper om kursens innehåll; när du har klarat det öppnas signalerna, som är desamma för alla och inte är någon bedömning av vad som passar dig.";

mustInclude("framsteg/index.html", QUIZ);
mustInclude("framsteg/index.html", "utmärkelse");
mustInclude("framsteg/index.html", "Skolan låser aldrig upp handel med riktiga pengar");
mustInclude("signaler/index.html", "Inga signaler publicerade än");
mustInclude("signaler/index.html", "EXEMPEL – inte en signal");
mustInclude("signalhistorik/index.html", "saknas");
mustInclude("coach/index.html", "Fråga Robban");
mustInclude("coach/index.html", "Robban Robotsson");
mustInclude("coach/index.html", "Varför svarar Robban så här?");
mustInclude("coach/index.html", "Om Robban");
mustInclude("coach/index.html", "Nästa nivå låses upp med nästa utmärkelse");
mustInclude("coach/llm-adapter.js", "COACH_LLM_ENABLED = false");

const data = JSON.parse(readFileSync(join(root, "data/signaler.json"), "utf8"));
if (!Array.isArray(data.signals) || data.signals.length !== 0) {
  failures.push("data/signaler.json: signals ska vara en tom lista");
}
if (COACH_LLM_ENABLED !== false) failures.push("COACH_LLM_ENABLED är inte false");

for (const question of ["Ska jag köpa nu?", "Passar det mig?", "Kan du rekommendera en affär?"]) {
  const reply = answerCoach(question, {});
  if (reply.text !== FIXED_REFUSAL || reply.source !== "guardrail") {
    failures.push(`Robban släppte igenom: ${question}`);
  }
}

const lesson = answerCoach("Riksbanken 1668", {});
if (!/Stockholms Banco|1668/.test(lesson.text)) {
  failures.push("Robban förklarade inte Riksbanken 1668 från kursen");
}
if (!/Nästa lektion/.test(lesson.text) || !/Kontrollfråga/.test(lesson.text)) {
  failures.push("Robban ställde inte kontrollfråga och nästa lektion");
}

for (const count of [0, 1, 2]) {
  const earned = awardsEarned(stateForAwards(count));
  if (earned.length !== count) failures.push(`utmärkelser för ${count} blev ${earned.length}`);
  if (levelFromAwardCount(earned.length) !== (count === 0 ? 1 : count === 1 ? 2 : 3)) {
    failures.push(`nivå för ${count} utmärkelser är fel`);
  }
}

const depths = [0, 1, 2].map((awards) => answerCoach("Delreservsystemet", {}, { awards }));
if (!(depths[0].text.length < depths[1].text.length && depths[1].text.length < depths[2].text.length)) {
  failures.push(
    `nivådjup skiljer sig inte: ${depths.map((reply) => reply.text.length).join(", ")}`,
  );
}
if (depths[0].level !== 1 || depths[1].level !== 2 || depths[2].level !== 3) {
  failures.push(`nivåfält: ${depths.map((reply) => reply.level).join(", ")}`);
}
if (depths[0].text === depths[1].text || depths[1].text === depths[2].text) {
  failures.push("nivå 1, 2 och 3 gav samma svar");
}
if (/Koppling mellan kurserna|Fråga i två steg|Följdfråga|signalkort/i.test(depths[0].text)) {
  failures.push("nivå 1 innehåller djupare lager");
}
if (!depths[1].text.includes("Koppling mellan kurserna") || !depths[1].text.includes("Fråga i två steg")) {
  failures.push("nivå 2 saknar koppling eller fråga i två steg");
}
if (/Följdfråga|signalkort/i.test(depths[1].text)) {
  failures.push("nivå 2 innehåller nivå 3");
}
if (!depths[2].text.includes("Följdfråga") || !/signalkort/i.test(depths[2].text) || !depths[2].text.includes("Koppling mellan kurserna")) {
  failures.push("nivå 3 saknar följdfråga, signalkort eller koppling");
}

const refusals = [0, 1, 2].map((awards) => answerCoach("Ska jag köpa nu?", {}, { awards }));
if (refusals.some((reply) => reply.text !== FIXED_REFUSAL || reply.source !== "guardrail")) {
  failures.push("spärren skiljer sig mellan nivåerna");
}
if (new Set(refusals.map((reply) => reply.text)).size !== 1) {
  failures.push("spärrtexten är inte identisk på varje nivå");
}

for (const reply of [...depths, ...refusals]) {
  const info = reply.transparency;
  if (!info) {
    failures.push("transparenspanel saknas");
    continue;
  }
  if (info.mode !== "kurskort" || info.llm !== false) failures.push("transparenspanel säger fel läge");
  if (!info.levelWhy || !info.limits || !info.stored || !info.href) failures.push("transparenspanel saknar fält");
  if (!/köpa eller sälja/.test(info.limits) || !/passar dig/.test(info.limits)) {
    failures.push("transparenspanel saknar spärren");
  }
  if (!/webbläsaren/.test(info.stored)) failures.push("transparenspanel saknar webbläsaren");
}

const basic = answerCoach("Vad är inflation i kursen?", {}, { awards: 0 });
const deeper = answerCoach("Vad är inflation i kursen?", {}, { awards: 1 });
if (basic.text === deeper.text) failures.push("inflation gav samma svar på nivå 1 och 2");
if (!basic.text.includes("Nästa nivå låses upp med nästa utmärkelse")) {
  failures.push("nivå 1 låser inte upp nästa begrepp");
}
if (!/Riksbanken|inflation/i.test(deeper.text)) failures.push("nivå 2 förklarade inte inflation från kursen");

const clock = formatWhen({ publishedDate: "2026-10-01", publishedTime: "09:15" });
if (clock !== "1 oktober 2026 kl. 09:15") failures.push(`Klockslag blev «${clock}»`);
if (/\b(CET|CEST|UTC|GMT)\b/.test(clock)) failures.push("Klockslag har tidszon");

const line = outcomeSentence({ outcome: "vinst", publishedDate: "saknas", publishedTime: "saknas" });
if (!/\bvinst\b/.test(line) || !/\brisk/.test(line) || !/säger ingenting om framtiden/.test(line)) {
  failures.push(`Utfallssats ofullständig: ${line}`);
}
if (/lovar|garanter|kommer att ge/.test(line)) failures.push("Utfallssats lovar något");

const joined = [...texts.values()].join("\n");
if (/COACH_LLM_API_KEY\s*[:=]\s*["'][^"']+["']/.test(joined) || /\bsk-[A-Za-z0-9]{8,}/.test(joined)) {
  failures.push("En nyckel ser ut att ligga i skolan/");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`ok: ${files.length} filer, tom signallista, Robban vägrar köp/sälj, flaggan är false`);
