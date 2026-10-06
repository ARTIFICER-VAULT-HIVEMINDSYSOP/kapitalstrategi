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
  "Kapital och Strategi",
  'href="/tradingskolan"',
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
  "investeringsråd",
  "live.kapitalstrategi.com",
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
const sep28 = editions.editions.find((edition) => edition.id === "2026-09-28");
if (!sep28) fail("saknar utgåvan 2026-09-28");
if (sep28.modules.length !== 6) fail("utgåvan ska ha 6 moduler");
const hrefs = sep28.modules.map((mod) => mod.href);
const expectedHrefs = [
  "/nyheter/2026-09-28/ipo/",
  "/nyheter/2026-09-28/olja/",
  "/nyheter/2026-09-28/guld/",
  "/nyheter/2026-09-28/ovriga-ravaror/",
  "/nyheter/2026-09-28/skolan/",
  "/nyheter/2026-09-28/tyst-tid/",
];
const tyst = sep28.modules.find((mod) => mod.slug === "tyst-tid");
if (tyst?.category?.sv !== "Skolan") fail("tyst-tid ska ligga i kategorin Skolan");
const tystHtml = fs.readFileSync(path.join(here, "2026-09-28/tyst-tid/index.html"), "utf8");
if (!tystHtml.includes("https://doi.org/10.1073/pnas.98.2.676")) fail("saknar PNAS-källan");
if (!tystHtml.includes("slopa-hörlurarna-vad-som-verkligen-händer-med-din-hjärna-utan-tysta-stunder/ar-AA2d3RyU") && !tystHtml.includes("slopa-h%C3%B6rlurarna")) {
  fail("saknar Dagens.se/MSN-källan");
}
const tystJson = JSON.parse(fs.readFileSync(path.join(here, "data/2026-09-28/tyst-tid.json"), "utf8"));
const tystBody = tystJson.translations.sv.blocks
  .filter((block) => !block.text.startsWith("Källor:"))
  .map((block) => block.text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"))
  .join(" ");
const tystWords = tystBody.split(/\s+/).filter(Boolean);
if (tystWords.length < 250 || tystWords.length > 400) fail(`tyst-tid ordantal ${tystWords.length}`);
if (JSON.stringify(hrefs) !== JSON.stringify(expectedHrefs)) fail(`fel modul-URL:er ${hrefs.join(", ")}`);

const oct = editions.editions.find((edition) => edition.id === "2026-10-01");
if (!oct) fail("saknar utgåvan 2026-10-01");
if (editions.editions[0]?.id !== "2026-10-01") fail("nyaste utgåvan ska vara 2026-10-01");
if (editions.editions[1]?.id !== "2026-09-28") fail("2026-09-28 ska ligga direkt efter 1 okt");
if (oct.modules.length !== 5) fail("1 okt ska ha 5 moduler");
const octHrefs = [
  "/nyheter/2026-10-01/ipo/",
  "/nyheter/2026-10-01/olja/",
  "/nyheter/2026-10-01/guld/",
  "/nyheter/2026-10-01/ovriga-ravaror/",
  "/nyheter/2026-10-01/skolan/",
];
const octTitles = [
  "IPO / nytt på börsen",
  "Vad som rör olja",
  "Guld",
  "Övriga råvaror",
  "Prova först · skolan",
];
if (JSON.stringify(oct.modules.map((mod) => mod.href)) !== JSON.stringify(octHrefs)) {
  fail(`fel 1 okt-URL:er ${oct.modules.map((mod) => mod.href).join(", ")}`);
}
if (JSON.stringify(oct.modules.map((mod) => mod.title.sv)) !== JSON.stringify(octTitles)) {
  fail("1 okt har fel modultitlar");
}
if (oct.modules.some((mod) => mod.slug === "tyst-tid" || mod.order !== oct.modules.indexOf(mod) + 1)) {
  fail("1 okt ska ha ordning 1–5 och ingen tyst-tid");
}
const octEdition = JSON.parse(fs.readFileSync(path.join(here, "data/2026-10-01/edition.json"), "utf8"));
if (octEdition.lead.sv !== "Torsdag 1 oktober — oljan vände upp under förmiddagen och Brent står åter kring 100 dollar fatet, sedan Kina stoppat exporten av raffinerade oljeprodukter. NordAmps fick en tung första dag på First North i går och fortsätter nedåt i dag. Guldet rör sig lite inför fredagens amerikanska jobbrapport. DI:s siffror för Brent, guld, silver, koppar och platina ligger klara.") {
  fail("1 okt lead stämmer inte");
}
if (octEdition.signoff.sv !== "Kapital och Strategi · utbildning och verktyg") fail("1 okt signoff");
if (octEdition.disclaimer.sv !== "Utbildning och information, inte investeringsråd.") fail("1 okt disclaimer");
if (octEdition.brand.sv !== "Kapital och Strategi") fail("1 okt brand");
if (octEdition.siteLabel !== "kapitalstrategi.com") fail("1 okt siteLabel");
const octRequired = [
  "10,72 kr",
  "−10,67 %",
  "12,00 kr",
  "8,22",
  "13,95 kr",
  "48,25 kr",
  "+3,88 %",
  "Stängning 30 sep: **saknas**",
  "70,70 kr",
  "52,60 kr",
  "−0,75 %",
  "61,70 kr",
  "+1,31 %",
  "54,6 MSEK",
  "66,6 MSEK",
  "40,8 MSEK",
  "61,3 %",
  "6 MSEK",
  "7,2 MSEK",
  "1,96 pund",
  "5,3 mdr pund",
  "270 miljoner",
  "529 miljoner pund",
  "100,03 USD/fat",
  "+2,24 %",
  "91,72",
  "+1,58 %",
  "100,09 dollar",
  "+2,1 %",
  "23,3 miljoner fat per dag",
  "103,50 dollar",
  "4 162,47 dollar/uns",
  "+0,13 %",
  "−2,60 %",
  "4 175,19 dollar/uns",
  "37 %",
  "89 %",
  "60,58 dollar/uns",
  "+0,30 %",
  "1 712,16 dollar/uns",
  "−0,22 %",
  "14 455 dollar/ton",
  "−0,13 %",
  "https://live.kapitalstrategi.com/tradingskolan",
  "/nyheter#ipo-cal-heading",
];
const octCorpus = ["edition.json", "ipo.json", "olja.json", "guld.json", "ovriga-ravaror.json", "skolan.json"]
  .map((name) => fs.readFileSync(path.join(here, "data/2026-10-01", name), "utf8"))
  .join("\n");
for (const needle of octRequired) {
  if (!octCorpus.includes(needle)) fail(`1 okt saknar text: ${needle}`);
}
for (const slug of ["ipo", "olja", "guld", "ovriga-ravaror", "skolan"]) {
  const html = fs.readFileSync(path.join(here, "2026-10-01", slug, "index.html"), "utf8");
  if (!html.includes("Utbildning och information, inte investeringsråd.")) fail(`1 okt ${slug} saknar utbildningsraden`);
  const json = JSON.parse(fs.readFileSync(path.join(here, "data/2026-10-01", `${slug}.json`), "utf8"));
  const first = json.translations.sv.blocks[0].text.replaceAll("**", "");
  if (!first.startsWith(json.translations.sv.ingress)) fail(`1 okt ${slug} ingress är inte ordagrant från första stycket`);
}
const octIpo = fs.readFileSync(path.join(here, "2026-10-01/ipo/index.html"), "utf8");
if ((octIpo.split("saknas").length - 1) !== 1) fail("1 okt IPO ska ha exakt ett saknas");
if (!octIpo.includes('class="ks-source"')) fail("1 okt IPO ska ha egna källblock");

const rendered = renderInline("**46 kr** och [IPO-kalender](/nyheter#ipo-cal-heading)");
if (rendered !== '<strong>46 kr</strong> och <a href="/nyheter#ipo-cal-heading">IPO-kalender</a>') {
  fail(`renderInline oväntat: ${rendered}`);
}

const newsShell = fs.readFileSync(path.join(here, "index.html"), "utf8");
if (!newsShell.includes("/nyheter/embed.js")) fail("nyheter/index.html saknar embed");
if (!newsShell.includes("history.replaceState")) fail("nyheter/index.html saknar slash-fix");
const root = fs.readFileSync(path.join(here, "../index.html"), "utf8");
if (!root.includes("/nyheter/embed.js")) fail("rotens index.html saknar embed");

function visibleText(raw) {
  return raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
}

for (const file of files) {
  if (!file.endsWith(".html")) continue;
  const visible = visibleText(fs.readFileSync(file, "utf8"));
  const rel = path.relative(here, file);
  if (visible.includes("Källor:") || visible.includes("Källa:")) fail(`${rel} har synlig källrad`);
  if (visible.includes("investeringsråd")) fail(`${rel} har synlig investeringsråd-rad`);
  if (visible.includes("live.kapitalstrategi.com")) fail(`${rel} har död live-länk`);
}

const nlIndex = JSON.parse(fs.readFileSync(path.join(here, "../newsletters/index.json"), "utf8"));
if (nlIndex.today !== "2026-09-28") fail(`newsletters today är ${nlIndex.today}`);
if (nlIndex.editions?.[0]?.date !== "2026-09-28") fail("senaste arkivutgåvan ska vara 2026-09-28");
const sep28 = JSON.parse(fs.readFileSync(path.join(here, "../newsletters/2026-09-28.json"), "utf8"));
if (!sep28.sections?.length) fail("2026-09-28.json saknar sections");
if (!JSON.stringify(sep28).includes("/nyheter/2026-09-28/")) fail("2026-09-28.json pekar inte på modulartiklar");
for (const date of ["2026-08-28", "2026-09-08", "2026-09-28"]) {
  const edition = JSON.parse(fs.readFileSync(path.join(here, `../newsletters/${date}.json`), "utf8"));
  for (const section of edition.sections || []) {
    for (const card of section.cards || []) {
      if (card.source) fail(`${date} har synligt source-fält`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("nyheter/check ok");
