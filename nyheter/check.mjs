import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderInline } from "./build.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const failures = [];

function fail(message) {
  failures.push(message);
}

const required = [
  "46 kr",
  "658 MSEK",
  "99 MSEK",
  "5 500",
  "2,36 mdr kr",
  "25–28 sep",
  "29 sep",
  "46,00 kr",
  "4 424 678",
  "91,2 %",
  "15,50 kr",
  "68,6 MSEK",
  "520",
  "30 sep",
  "70 kr",
  "72,40 kr",
  "97,7 MSEK",
  "55 kr",
  "52,70 kr",
  "27,5 MSEK",
  "67,00 kr",
  "99,09 USD/fat",
  "−5,01 %",
  "94,05",
  "+1,81 %",
  "06:50",
  "4 197,36 dollar/uns",
  "−2,04 %",
  "61,98 dollar/uns",
  "−3,55 %",
  "1 733,80 dollar/uns",
  "−2,65 %",
  "14 647 dollar/ton",
  "−0,80 %",
  "18:00",
  "120 miljarder kronor",
  "saknas",
  "Utbildning och information, inte investeringsråd.",
  "Kapital och Strategi",
  "https://live.kapitalstrategi.com/tradingskolan",
  "https://www.di.se/ravaror/",
  "https://mfn.se/all/a/linjemontage/first-day-of-trading-in-linjemontages-shares-on-nasdaq-stockholm",
  "/nyheter#ipo-cal-heading",
];

const banned = [
  "Status (internt)",
  "Ämnesrad (förslag)",
  "public/ipo-kalender.html",
  "rådgivning",
  "rådgivare",
  "investeringsrekommendation",
  "Fraunces",
  "Trade Rider",
  "trade-rider",
];

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

const shell = path.join(here, "index.html");
const files = walk(here).filter((file) => {
  if (file === shell || file.endsWith("check.mjs") || file.endsWith("build.mjs") || file.endsWith("embed.js")) return false;
  return true;
});
const corpus = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");

for (const needle of required) {
  if (!corpus.includes(needle)) fail(`saknar text: ${needle}`);
}

const traderiderMentionOk = new Set([
  "data/2026-09-28/tyst-tid.json",
  "2026-09-28/tyst-tid/index.html",
]);

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const rel = path.relative(here, file);
  for (const needle of banned) {
    if (text.includes(needle)) fail(`${rel} innehåller ${needle}`);
  }
  if (text.includes("Traderider") && !traderiderMentionOk.has(rel)) {
    fail(`${rel} nämner Traderider utanför skolmodulen`);
  }
  if (/href="[^"]*traderider/i.test(text) || /href="[^"]*trade-rider/i.test(text)) {
    fail(`${rel} länkar till Traderider`);
  }
  if (file.endsWith(".html") && /(?:^|\n)Hej,/.test(text)) fail(`${file} innehåller hälsningen Hej,`);
}

const ipo = fs.readFileSync(path.join(here, "2026-09-28/ipo/index.html"), "utf8");
const saknasInIpo = ipo.split("saknas").length - 1;
if (saknasInIpo !== 5) fail(`IPO-artikeln ska ha 5 × saknas, har ${saknasInIpo}`);
const olja = fs.readFileSync(path.join(here, "2026-09-28/olja/index.html"), "utf8");
if ((olja.split("saknas").length - 1) !== 1) fail("Oljeartikeln ska behålla Baha.com saknas");

const editions = JSON.parse(fs.readFileSync(path.join(here, "data/editions.json"), "utf8"));
if (editions.editions[0].modules.length !== 6) fail("utgåvan ska ha 6 moduler");
const hrefs = editions.editions[0].modules.map((mod) => mod.href);
const expectedHrefs = [
  "/nyheter/2026-09-28/ipo/",
  "/nyheter/2026-09-28/olja/",
  "/nyheter/2026-09-28/guld/",
  "/nyheter/2026-09-28/ovriga-ravaror/",
  "/nyheter/2026-09-28/skolan/",
  "/nyheter/2026-09-28/tyst-tid/",
];
const tyst = editions.editions[0].modules.find((mod) => mod.slug === "tyst-tid");
if (tyst?.category?.sv !== "Skolan") fail("tyst-tid ska ligga i kategorin Skolan");
const tystHtml = fs.readFileSync(path.join(here, "2026-09-28/tyst-tid/index.html"), "utf8");
if (!tystHtml.includes("https://doi.org/10.1073/pnas.98.2.676")) fail("saknar Raichle-källan");
if (!tystHtml.includes("slopa-hörlurarna-vad-som-verkligen-händer-med-din-hjärna-utan-tysta-stunder/ar-AA2d3RyU") && !tystHtml.includes("slopa-h%C3%B6rlurarna")) {
  fail("saknar Dagens.se/MSN-källan");
}
if (!tystHtml.includes("Utbildning och information, inte investeringsråd.")) fail("tyst-tid saknar utbildningsraden");
const tystJson = JSON.parse(fs.readFileSync(path.join(here, "data/2026-09-28/tyst-tid.json"), "utf8"));
const tystBody = tystJson.translations.sv.blocks
  .filter((block) => !block.text.startsWith("Källor:"))
  .map((block) => block.text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"))
  .join(" ");
const tystWords = tystBody.split(/\s+/).filter(Boolean);
if (tystWords.length < 250 || tystWords.length > 400) fail(`tyst-tid ordantal ${tystWords.length}`);
if (JSON.stringify(hrefs) !== JSON.stringify(expectedHrefs)) fail(`fel modul-URL:er ${hrefs.join(", ")}`);

const rendered = renderInline("**46 kr** och [IPO-kalender](/nyheter#ipo-cal-heading)");
if (rendered !== '<strong>46 kr</strong> och <a href="/nyheter#ipo-cal-heading">IPO-kalender</a>') {
  fail(`renderInline oväntat: ${rendered}`);
}

const newsShell = fs.readFileSync(path.join(here, "index.html"), "utf8");
if (!newsShell.includes("/nyheter/embed.js")) fail("nyheter/index.html saknar embed");
if (!newsShell.includes("history.replaceState")) fail("nyheter/index.html saknar slash-fix");
const root = fs.readFileSync(path.join(here, "../index.html"), "utf8");
if (!root.includes("/nyheter/embed.js")) fail("rotens index.html saknar embed");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("nyheter/check ok");
