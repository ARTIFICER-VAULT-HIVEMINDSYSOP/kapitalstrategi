/**
 * Gemensam motor för Kapitalnytt och Urbergsskölden.
 * Läser inlagg/*.md, skriver bara godkanda inlägg vars publiceras har passerat
 * i Europe/Stockholm, och granskar utkast med varning i stället för fel.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FINANCE_DISCLAIMER, origin, sections } from "./config.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(here, "..");

export { FINANCE_DISCLAIMER, sections };

const NOT_ADVICE = [
  /inte\s+investeringsrådgivning/iu,
  /inte\s+investeringsråd\b/iu,
  /detta\s+är\s+inte\s+råd/iu,
  /detta\s+är\s+inte\s+rådgivning/iu,
  /inte\s+personlig\s+rådgivning/iu,
  /inte\s+personligt\s+råd/iu,
];
const INTERNAL_NOTE = [
  [/\bTODO\b/, "TODO"],
  [/(?:^|[^\p{L}])internt(?=$|[^\p{L}])/iu, "ordet internt"],
  [/(?:^|[^\p{L}\p{N}])ÖB(?=$|[^\p{L}\p{N}])/u, "ordet ÖB"],
  [/(?:^|[^\p{L}])(?:ChatGPT|Anthropic|Claude|Cursor)(?=$|[^\p{L}])/iu, "bot- eller agentnamn"],
];

const IMAGE_SOURCES = new Set(["egen", "unsplash", "pexels", "wikimedia"]);
const MAR_FIELDS = ["upphov", "framstalld", "spridd", "metod", "intressekonflikter", "innehav"];
const STATUSES = new Set(["utkast", "godkand"]);
const DATA_LABELS = new Set(["VERKLIG", "SIMULERAD", "ingen"]);
const KOPPLING = new Set(["utbildning", "tjanst", "licens", "ingen"]);
const PROFIT_STEMS = [
  "avkastning",
  "vinst",
  "tillväxt",
  "lönsamhet",
  "lönsam",
  "värdestegring",
  "värdeökning",
  "överavkastning",
];
const RISK_STEMS = ["risk", "förlust", "förlor", "sjunk", "osäker", "nedgång"];
const BROKER_PHRASES = [
  "avanza",
  "nordnet",
  "etoro",
  "e-toro",
  "degiro",
  "saxo",
  "saxobank",
  "plus500",
  "skilling",
  "cmc markets",
  "cmcmarkets",
  "interactive brokers",
  "interactivebrokers",
  "ig markets",
  "ig index",
  "pepperstone",
  "admiral markets",
  "admirals",
  "oanda",
  "tickmill",
  "swissquote",
  "robomarkets",
  "montrose",
  "binance",
  "coinbase",
  "savr",
  "xtb",
  "lynx",
  "avanza.se",
  "nordnet.se",
  "etoro.com",
  "degiro.se",
  "degiro.com",
  "saxo.com",
  "saxobank.com",
  "plus500.com",
  "skilling.com",
  "cmcmarkets.com",
  "ig.com",
  "ig.se",
  "interactivebrokers.com",
  "montrose.se",
  "savr.com",
  "savr.se",
  "xtb.com",
  "capital.com",
  "lynx.se",
];
const CALL_PATTERNS = [
  /köp\s+nu/iu,
  /sälj\s+nu/iu,
  /kop\s+nu/iu,
  /salj\s+nu/iu,
  /handla\s+nu/iu,
  /redo\s+att\s+handla/iu,
  /godkänd(?:a)?\s+för\s+signaler/iu,
];
const PRICE_PATTERNS = [
  /kursmål/iu,
  /riktkurs/iu,
  /köp\s+under/iu,
  /sälj\s+över/iu,
  /stop(?:p)?(?:\s|-)?loss[^.\n]{0,24}\d/iu,
  /\btarget\b[^.\n]{0,24}\d/iu,
  /\bstopp\b[^.\n]{0,12}\d/iu,
];
const HUNT_PATTERNS = [
  /tjuvjakt/iu,
  /olovlig\s+jakt/iu,
  /olaga\s+jakt/iu,
  /utan\s+jakträtt/iu,
  /jakt\s+utan\s+tillstånd/iu,
  /fotsnara/iu,
  /giftsnara/iu,
  /förgifta/iu,
  /skjut\s+från\s+bil/iu,
  /jaga\s+från\s+fordon/iu,
];
const ENERGY_CLAIM = /\d[\d\s\u00a0.,]*\s*(?:%|procent|kr\b|kronor|sek\b)/iu;
const ENERGY_PROMISE = [
  /garanter\p{L}*\s+\p{L}*\s*bespar/iu,
  /sparar\s+alltid/iu,
  /lovar\s+att\s+spara/iu,
  /säker\s+besparing/iu,
];
const FIGURE = /(?:\d[\d\s\u00a0.,]*\s*(?:%|procent|kr\b|kronor|sek\b|usd\b|eur\b|msek|mdkr|mkr\b))|(?:(?:^|[^\p{L}\p{N}])\d{1,3}(?:[\s\u00a0]\d{3})+(?:[,.]\d+)?(?=$|[^\p{L}\p{N}]))/iu;
const TIMEZONE = /(?:^|[^\p{L}])(?:CET|CEST|UTC|GMT)(?=$|[^\p{L}])/iu;
const COORD_PATTERNS = [
  /(?:^|[^\p{L}])\d{2}[.,]\d{3,}\s*[,/]\s*\d{1,3}[.,]\d{3,}/u,
  /°/u,
  /(?:^|[^\p{L}])(?:latitud|longitud|latitude|longitude|lat|lng|lon)(?=$|[^\p{L}])\s*[:=]/iu,
  /(?:^|[^\p{L}])(?:RT\s*90|SWEREF\s*99|SWEREF)(?=$|[^\p{L}\p{N}])/iu,
  /(?:^|[^\p{L}\p{N}])[67]\d{6}(?=$|[^\p{L}\p{N}])/u,
  /(?:^|[^\p{L}])[NS]\s*\d{2}[.,]\d{2,}/iu,
  /(?:^|[^\p{L}])[EW]\s*\d{1,3}[.,]\d{2,}/iu,
];

const MONTHS = [
  "januari",
  "februari",
  "mars",
  "april",
  "maj",
  "juni",
  "juli",
  "augusti",
  "september",
  "oktober",
  "november",
  "december",
];

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeXml(value) {
  return escapeHtml(value).replace(/'/g, "&apos;");
}

function escapeReg(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function str(value) {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value).trim();
}

function asBool(value) {
  return value === true || value === "true";
}

function asList(value) {
  if (!Array.isArray(value)) return [];
  return value.map(str).map((item) => item.trim()).filter(Boolean);
}

export function stockholmStamp(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Stockholm",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );
  let hour = parts.hour === "24" ? "00" : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${hour.padStart(2, "0")}:${parts.minute.padStart(2, "0")}`;
}

export function swedishDate(stamp) {
  const match = String(stamp || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
}

export function stripTimezone(value) {
  return String(value || "")
    .replace(TIMEZONE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasStem(text, stems) {
  for (const stem of stems) {
    const pattern = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeReg(stem)}`, "iu");
    if (pattern.test(text)) return stem;
  }
  return "";
}

export function hasCoordinates(text) {
  return COORD_PATTERNS.some((pattern) => pattern.test(String(text)));
}

export function splitSentences(text) {
  return String(text)
    .split(/\n+|(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function nextContent(lines, index) {
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    if (lines[cursor].trim() && !/^\s*#/.test(lines[cursor])) return lines[cursor];
  }
  return "";
}

export function parseScalar(raw) {
  const value = String(raw).trim();
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    const inner = value.slice(1, -1);
    return value.startsWith('"') ? inner.replace(/\\n/g, "\n").replace(/\\"/g, '"') : inner;
  }
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "~" || value === "") return "";
  return value;
}

export function parseSimpleYaml(text) {
  const lines = String(text).split(/\r?\n/);
  const root = {};
  const stack = [{ indent: -1, type: "map", value: root }];

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    if (!raw.trim() || /^\s*#/.test(raw)) continue;
    const indent = raw.match(/^ */)[0].length;
    const line = raw.trim();
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const frame = stack[stack.length - 1];

    if (line.startsWith("- ")) {
      if (frame.type !== "list") throw new Error(`lista utan nyckel: ${line}`);
      frame.value.push(parseScalar(line.slice(2).trim()));
      continue;
    }

    const colon = line.indexOf(":");
    if (colon <= 0) throw new Error(`ogiltig rad: ${line}`);
    const key = line.slice(0, colon).trim();
    const rest = line.slice(colon + 1).trim();
    if (frame.type !== "map") throw new Error(`nyckel i lista: ${key}`);

    if (rest === "[]") {
      frame.value[key] = [];
      continue;
    }
    if (rest === "{}") {
      frame.value[key] = {};
      continue;
    }
    if (rest.startsWith("[") && rest.endsWith("]") && (rest === "[]" || rest.includes(","))) {
      const inner = rest.slice(1, -1).trim();
      frame.value[key] = inner ? inner.split(",").map((part) => parseScalar(part.trim())) : [];
      continue;
    }
    if (rest === "" || rest === "|" || rest === ">") {
      const upcoming = nextContent(lines, index);
      const upcomingIndent = upcoming ? upcoming.match(/^ */)[0].length : -1;
      const upcomingTrim = upcoming ? upcoming.trim() : "";
      if (rest === "|" || rest === ">") {
        const block = [];
        let cursor = index + 1;
        for (; cursor < lines.length; cursor += 1) {
          if (!lines[cursor].trim()) {
            block.push("");
            continue;
          }
          const blockIndent = lines[cursor].match(/^ */)[0].length;
          if (blockIndent <= indent) break;
          block.push(lines[cursor].slice(indent + 2));
        }
        const joined = rest === "|" ? block.join("\n") : block.join(" ");
        frame.value[key] = joined.trim();
        index = cursor - 1;
        continue;
      }
      if (upcoming && upcomingIndent > indent && upcomingTrim.startsWith("- ")) {
        const list = [];
        frame.value[key] = list;
        stack.push({ indent, type: "list", value: list });
        continue;
      }
      if (upcoming && upcomingIndent > indent) {
        const child = {};
        frame.value[key] = child;
        stack.push({ indent, type: "map", value: child });
        continue;
      }
      frame.value[key] = "";
      continue;
    }
    frame.value[key] = parseScalar(rest);
  }
  return root;
}

export function parsePost(markdown, file = "") {
  const match = String(markdown).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file || "inlägg"}: saknar frontmatter`);
  const data = parseSimpleYaml(match[1]);
  const bildIn = data.bild && typeof data.bild === "object" ? data.bild : {};
  const marIn = data.mar && typeof data.mar === "object" ? data.mar : null;
  let cta = null;
  if (data.cta && typeof data.cta === "object") {
    cta = { text: str(data.cta.text), url: str(data.cta.url) };
  }
  return {
    file,
    slug: file ? path.basename(file, ".md") : "",
    titel: str(data.titel),
    datum: str(data.datum),
    publiceras: str(data.publiceras),
    status: str(data.status),
    forfattare: str(data.forfattare),
    sammanfattning: str(data.sammanfattning),
    kategori: str(data.kategori),
    taggar: asList(data.taggar),
    sprak: str(data.sprak) || "sv",
    data: str(data.data) || "ingen",
    kallor: asList(data.kallor),
    bild: {
      status: str(bildIn.status),
      kalla: str(bildIn.kalla),
      credit: str(bildIn.credit),
      licens: str(bildIn.licens),
      src: str(bildIn.src),
    },
    koppling: str(data.koppling) || "ingen",
    cta,
    marknadsforing: asBool(data.marknadsforing),
    finans: asBool(data.finans),
    mar: marIn
      ? {
          upphov: str(marIn.upphov),
          framstalld: str(marIn.framstalld),
          spridd: str(marIn.spridd),
          metod: str(marIn.metod),
          intressekonflikter: str(marIn.intressekonflikter),
          innehav: str(marIn.innehav),
        }
      : null,
    kulturarv: data.kulturarv && typeof data.kulturarv === "object" ? data.kulturarv : null,
    body: match[2].replace(/^\n/, "").trim(),
  };
}

export function loadPosts(dir) {
  const folder = path.join(dir, "inlagg");
  if (!fs.existsSync(folder)) return [];
  return fs
    .readdirSync(folder)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => parsePost(fs.readFileSync(path.join(folder, name), "utf8"), path.join(folder, name)));
}

export function isPublished(post, now = new Date()) {
  if (post.status !== "godkand") return false;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(post.publiceras)) return false;
  return post.publiceras <= stockholmStamp(now);
}

export function selectPublished(posts, now = new Date()) {
  return posts
    .filter((post) => isPublished(post, now))
    .sort((a, b) => (a.publiceras < b.publiceras ? 1 : a.publiceras > b.publiceras ? -1 : a.slug.localeCompare(b.slug, "sv")));
}

export function financeOn(section, post) {
  return Boolean(section.finansAlltid || post?.finans);
}

export function disclaimerFor(section, post = null) {
  if (post?.kategori === "marknadsanalys") return "";
  if (!financeOn(section, post)) return "";
  return FINANCE_DISCLAIMER;
}

export function attributionRequired(licens) {
  return /cc[\s-]*by(?:[\s-]*sa)?\b/iu.test(String(licens || ""));
}

function showMarketing(post) {
  return Boolean(post?.marknadsforing || post?.cta);
}

export function imageReady(bild) {
  if (!bild) return false;
  return (
    bild.status === "godkand" &&
    IMAGE_SOURCES.has(String(bild.kalla).toLowerCase()) &&
    Boolean(bild.credit && bild.licens && bild.src)
  );
}

function proseOf(post) {
  const parts = [post.titel, post.sammanfattning, post.body, post.cta?.text || "", post.cta?.url || ""];
  if (post.mar) parts.push(...MAR_FIELDS.map((field) => post.mar[field] || ""));
  if (post.kulturarv) parts.push(...Object.values(post.kulturarv).map((value) => str(value)));
  parts.push(...post.kallor, ...post.taggar);
  return parts.filter(Boolean).join("\n");
}

function mentionsBroker(text) {
  const lower = text.toLocaleLowerCase("sv");
  for (const phrase of BROKER_PHRASES) {
    if (phrase.includes(" ") || phrase.includes(".")) {
      if (lower.includes(phrase)) return phrase;
      continue;
    }
    if (hasStem(lower, [phrase])) return phrase;
  }
  return "";
}

function badCta(cta) {
  if (!cta) return "";
  const url = cta.url || "";
  if (!url) return "cta saknar url";
  if (/^https?:/i.test(url) || url.startsWith("//")) return "cta är extern";
  if (!url.startsWith("/")) return "cta ska vara en intern sökväg";
  const broker = mentionsBroker(url);
  if (broker) return `cta pekar på en mäklare (${broker})`;
  if (/nyheter|traderider|trade-rider|nyhetsbrev|crm/i.test(url)) return "cta pekar fel";
  return "";
}

function awardAsLicence(text) {
  for (const sentence of splitSentences(text)) {
    if (!/utmärkelse/iu.test(sentence)) continue;
    if (!/(licens|auktorisation|auktoriserad|tillstånd)/iu.test(sentence)) continue;
    if (/inte\s+(?:en\s+)?(?:licens|auktorisation|auktoriserad|tillstånd)/iu.test(sentence)) continue;
    if (/ingen\s+(?:licens|auktorisation|auktoriserad)/iu.test(sentence)) continue;
    if (/skilj\p{L}*\s+.{0,60}från/iu.test(sentence)) continue;
    return sentence;
  }
  return "";
}

function promiseSentence(text) {
  for (const sentence of splitSentences(text)) {
    if (/säker\s+vinst/iu.test(sentence)) return sentence;
    if (/säker\s+avkastning/iu.test(sentence)) return sentence;
    if (/riskfri/iu.test(sentence) && !/inte\s+riskfri/iu.test(sentence)) return sentence;
    if (/(?:^|[^\p{L}])utan\s+risk/iu.test(sentence) && !/inte\s+utan\s+risk/iu.test(sentence)) return sentence;
    if (/garanter\p{L}*/iu.test(sentence) && !/inte\s+garanter/iu.test(sentence)) return sentence;
    if (/lovar\s+vinst/iu.test(sentence)) return sentence;
  }
  return "";
}

function profitWithoutRisk(text) {
  const hits = [];
  for (const sentence of splitSentences(text)) {
    const profit = hasStem(sentence, PROFIT_STEMS);
    if (!profit) continue;
    if (hasStem(sentence, RISK_STEMS)) continue;
    hits.push(sentence);
  }
  return hits;
}

export function reviewPost(post, section) {
  const approved = post.status === "godkand";
  const issues = [];
  const flag = (message) => {
    issues.push({
      level: approved ? "fail" : "warn",
      message,
      file: post.file || post.slug,
    });
  };
  const prose = proseOf(post);
  const finance = financeOn(section, post);

  if (!STATUSES.has(post.status)) flag(`ogiltig status: ${post.status || "saknas"}`);
  if (!post.titel) flag("titel saknas");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(post.publiceras)) {
    flag("publiceras ska vara YYYY-MM-DDTHH:MM utan tidszonsetikett");
  }
  if (!section.kategorier[post.kategori]) flag(`okänd kategori: ${post.kategori || "saknas"}`);
  if (!DATA_LABELS.has(post.data)) flag(`ogiltigt data-värde: ${post.data}`);
  if (!KOPPLING.has(post.koppling)) flag(`ogiltig koppling: ${post.koppling}`);

  if (/magasinet/iu.test(prose)) flag("blockerat ord");
  if (TIMEZONE.test(prose)) flag("tidszonsetikett");
  for (const pattern of NOT_ADVICE) {
    if (pattern.test(prose)) {
      flag("formulering om att texten inte är råd");
      break;
    }
  }
  for (const [pattern, label] of INTERNAL_NOTE) {
    if (pattern.test(prose)) flag(label);
  }

  const award = awardAsLicence(prose);
  if (award) flag(`utmärkelse beskriven som licens eller auktorisation: ${award}`);

  const imageIntent = post.bild.status === "godkand" || post.bild.src || post.bild.kalla;
  if (imageIntent && (!post.bild.credit || !post.bild.licens)) {
    flag("bild saknar credit eller licens");
  }
  if (post.bild.status === "godkand" && !imageReady(post.bild)) {
    flag("bild är godkand men saknar tillåten källa, credit, licens eller src");
  }

  if (post.cta && !post.marknadsforing) {
    flag("cta utan marknadsforing: true (etiketten Marknadsföring skulle saknas)");
  }
  if (post.cta) {
    const ctaProblem = badCta(post.cta);
    if (ctaProblem) flag(ctaProblem);
  }

  if (post.kategori === "marknadsanalys") {
    if (!post.kallor.length) flag("marknadsanalys saknar kallor");
    const missing = MAR_FIELDS.filter((field) => !post.mar || !str(post.mar[field]));
    if (missing.length) flag(`MAR-information saknar: ${missing.join(", ")}`);
  }

  if (finance) {
    if (hasStem(prose, ["paper"])) flag("ordet paper");
    const broker = mentionsBroker(prose);
    if (broker) flag(`mäklare: ${broker}`);
    for (const pattern of CALL_PATTERNS) {
      if (pattern.test(prose)) {
        flag(`otillåten uppmaning: ${prose.match(pattern)[0]}`);
        break;
      }
    }
    for (const pattern of PRICE_PATTERNS) {
      if (pattern.test(prose)) {
        flag(`kursnivå: ${prose.match(pattern)[0]}`);
        break;
      }
    }
    const promised = promiseSentence(prose);
    if (promised) flag(`vinstlöfte: ${promised}`);
    for (const sentence of profitWithoutRisk(prose)) {
      flag(`avkastningsord utan riskord i samma mening: ${sentence}`);
    }
    if (FIGURE.test(`${post.titel}\n${post.sammanfattning}\n${post.body}`) && post.data !== "VERKLIG" && post.data !== "SIMULERAD") {
      flag("siffror utan data-märkning (VERKLIG eller SIMULERAD)");
    }
    if (/nyhetsbrev|\/nyheter\b|traderider|trade-rider|\bcrm\b/i.test(prose)) {
      flag("länk eller hänvisning till nyhetsbrev, nyheter eller CRM");
    }
  }

  if (section.fornminneKategori && post.kategori === section.fornminneKategori) {
    if (!post.kulturarv || !str(post.kulturarv.lamning)) flag("kulturarv-block saknas");
    if (hasCoordinates(prose)) flag("koordinater i fornminnesinlägg");
  }

  if (section.jaktKategori && post.kategori === section.jaktKategori) {
    for (const pattern of HUNT_PATTERNS) {
      if (pattern.test(prose)) {
        flag(`jaktinnehåll utanför laglig jakt: ${prose.match(pattern)[0]}`);
        break;
      }
    }
  }

  if (section.energiKategori && post.kategori === section.energiKategori) {
    for (const pattern of ENERGY_PROMISE) {
      if (pattern.test(prose)) {
        flag(`energilöfte: ${prose.match(pattern)[0]}`);
        break;
      }
    }
    if (ENERGY_CLAIM.test(`${post.titel}\n${post.sammanfattning}\n${post.body}`)) {
      if (!post.kallor.length && post.data !== "SIMULERAD") {
        flag("energipåstående i procent eller kronor saknar källa eller data: SIMULERAD");
      }
    }
  }

  if (!section.finansAlltid) {
    const factual = FIGURE.test(`${post.titel}\n${post.sammanfattning}\n${post.body}`) || ENERGY_CLAIM.test(post.body);
    const needsSource = approved || factual;
    if (needsSource && !post.kallor.length && post.data !== "SIMULERAD") flag("fakta saknar kallor");
  }

  return issues;
}

export function renderInline(markdown) {
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let html = "";
  let last = 0;
  const source = String(markdown);
  for (const match of source.matchAll(pattern)) {
    html += escapeHtml(source.slice(last, match.index));
    if (match[1] != null) {
      const href = match[2].trim();
      const unsafe = /^\s*(?:javascript|data):/i.test(href);
      if (unsafe) {
        html += escapeHtml(match[1]);
      } else {
        const external = /^https?:/i.test(href);
        html += `<a href="${escapeHtml(href)}"${external ? ' rel="noopener noreferrer"' : ""}>${escapeHtml(match[1])}</a>`;
      }
    } else {
      html += `<strong>${escapeHtml(match[3])}</strong>`;
    }
    last = match.index + match[0].length;
  }
  html += escapeHtml(source.slice(last));
  return html;
}

function renderBlocks(body) {
  return String(body)
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split(/\n/).map((line) => line.trim()).filter(Boolean);
      if (!lines.length) return "";
      if (lines.every((line) => line.startsWith("- "))) {
        return `<ul>\n${lines.map((line) => `            <li>${renderInline(line.slice(2))}</li>`).join("\n")}\n          </ul>`;
      }
      if (lines.length === 1 && lines[0].startsWith("### ")) return `<h3>${renderInline(lines[0].slice(4))}</h3>`;
      if (lines.length === 1 && lines[0].startsWith("## ")) return `<h2>${renderInline(lines[0].slice(3))}</h2>`;
      return `<p>${lines.map((line) => renderInline(line)).join("<br />\n")}</p>`;
    })
    .filter(Boolean)
    .join("\n          ");
}

function categoryLabel(section, slug) {
  return section.kategorier[slug] || slug;
}

function safeCta(post) {
  if (!post.marknadsforing || !post.cta?.text || !post.cta?.url) return null;
  if (badCta(post.cta)) return null;
  return post.cta;
}

function renderMar(post) {
  if (post.kategori !== "marknadsanalys" || !post.mar) return "";
  const rows = [
    ["Upphov", post.mar.upphov],
    ["Framställd", stripTimezone(post.mar.framstalld)],
    ["Först spridd", stripTimezone(post.mar.spridd)],
    ["Metod", post.mar.metod],
    ["Intressekonflikter", post.mar.intressekonflikter],
    ["Innehav", post.mar.innehav],
  ];
  if (post.kallor.length) rows.push(["Källor", post.kallor.join("; ")]);
  return `<aside class="kn-mar" aria-label="MAR-information">
          <h2>MAR-information</h2>
          <dl>
${rows
  .map(
    ([label, value]) => `            <div>
              <dt>${escapeHtml(label)}</dt>
              <dd>${escapeHtml(value)}</dd>
            </div>`
  )
  .join("\n")}
          </dl>
          <p class="kn-mar-risk">${escapeHtml(FINANCE_DISCLAIMER)}</p>
        </aside>`;
}

function renderKulturarv(post) {
  if (!post.kulturarv) return "";
  const rows = [];
  if (str(post.kulturarv.lamning)) rows.push(["Lämning", str(post.kulturarv.lamning)]);
  if (typeof post.kulturarv.kanslig === "boolean") {
    rows.push(["Känslig lämning", post.kulturarv.kanslig ? "ja" : "nej"]);
  }
  if (!rows.length) return "";
  return `<aside class="kn-arv" aria-label="Kulturarv">
          <h2>Kulturarv</h2>
          <dl>
${rows
  .map(
    ([label, value]) => `            <div>
              <dt>${escapeHtml(label)}</dt>
              <dd>${escapeHtml(value)}</dd>
            </div>`
  )
  .join("\n")}
          </dl>
        </aside>`;
}

function layout({ section, title, description, canonical, main, home, lang = "sv" }) {
  const brand = home
    ? `<h1 class="kn-brand"><a href="${escapeHtml(section.route)}"><img src="/favicon.svg" alt="" width="28" height="28" /><span>${escapeHtml(section.namn)}</span></a></h1>`
    : `<a class="kn-brand" href="${escapeHtml(section.route)}"><img src="/favicon.svg" alt="" width="28" height="28" /><span>${escapeHtml(section.namn)}</span></a>`;
  const omHref = home ? "#om" : `${section.route}#om`;
  return `<!doctype html>
<html lang="${escapeHtml(lang)}" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0a1628" />
    <meta name="description" content="${escapeHtml(description)}" />
    <title>${escapeHtml(title)}</title>
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="${escapeHtml(section.route)}modul.css" />
    <script>
      (function () {
        var theme = "dark";
        try {
          var raw = localStorage.getItem("ig.app.theme");
          if (raw != null) {
            var saved = JSON.parse(raw);
            if (saved === "light" || saved === "dark") theme = saved;
          }
        } catch (e) {}
        document.documentElement.setAttribute("data-theme", theme);
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", theme === "light" ? "#f4efe4" : "#0a1628");
      })();
    </script>
  </head>
  <body>
    <a class="kn-skip" href="#innehall">Till innehållet</a>
    <header class="kn-top">
      <div class="kn-top-inner">
        ${brand}
        <p class="kn-tagline">${escapeHtml(section.tagline)}</p>
        <nav aria-label="Sektion"><a href="${escapeHtml(omHref)}">Om</a>${home ? "" : `<a href="${escapeHtml(section.route)}">Inlägg</a>`}</nav>
        <button type="button" class="kn-theme" id="kn-theme">Ljust</button>
      </div>
    </header>
    <main id="innehall" class="kn-wrap${home ? " kn-home" : ""}">
${main}
    </main>
    <script src="${escapeHtml(section.route)}modul.js"></script>
  </body>
</html>
`;
}

export function renderIndex(section, posts) {
  const filters = [
    `<button type="button" data-filter="alla" aria-pressed="true">Alla</button>`,
    ...Object.entries(section.kategorier).map(
      ([slug, label]) => `<button type="button" data-filter="${escapeHtml(slug)}">${escapeHtml(label)}</button>`
    ),
  ].join("\n          ");
  const cards = posts
    .map((post) => {
      const badge =
        post.data === "VERKLIG" || post.data === "SIMULERAD"
          ? `\n            <p class="kn-badge">${escapeHtml(post.data)}</p>`
          : "";
      const ad = showMarketing(post) ? `<p class="kn-ad">Marknadsföring</p>` : "";
      return `<li data-kategori="${escapeHtml(post.kategori)}">
          <article>
            <p class="kn-kicker">${escapeHtml(categoryLabel(section, post.kategori))}</p>
            <div class="kn-title-row">
              <h2><a href="${escapeHtml(section.route)}${escapeHtml(post.slug)}/">${escapeHtml(post.titel)}</a></h2>
              ${ad}
            </div>
            <p class="kn-meta">${escapeHtml(swedishDate(post.datum || post.publiceras))}</p>
            <p>${escapeHtml(post.sammanfattning)}</p>${badge}
          </article>
        </li>`;
    })
    .join("\n        ");
  const list = posts.length
    ? `<ul class="kn-list">\n        ${cards}\n      </ul>`
    : `<p class="kn-empty">Inga publicerade inlägg ännu.</p>`;
  const om = section.om.map((paragraph) => `        <p>${escapeHtml(paragraph)}</p>`).join("\n");
  const disclaimer = disclaimerFor(section);
  const disclaimerHtml = disclaimer ? `      <p class="kn-disclaimer">${escapeHtml(disclaimer)}</p>\n` : "";
  const main = `${disclaimerHtml}      <section id="om" class="kn-om" aria-label="Om">
        <h2>Om</h2>
${om}
      </section>
      <div class="kn-filters" role="group" aria-label="Filtrera på kategori">
          ${filters}
      </div>
      ${list}`;
  return layout({
    section,
    title: section.namn,
    description: section.beskrivning,
    canonical: `${origin}${section.route}`,
    main,
    home: true,
  });
}

export function renderPost(section, post) {
  const badge =
    post.data === "VERKLIG" || post.data === "SIMULERAD"
      ? `\n      <p class="kn-badge">${escapeHtml(post.data)}</p>`
      : "";
  const ad = showMarketing(post) ? `<p class="kn-ad">Marknadsföring</p>` : "";
  const credit = imageReady(post.bild) && attributionRequired(post.bild.licens)
    ? `\n        <figcaption class="kn-credit">${escapeHtml(post.bild.credit)}. ${escapeHtml(post.bild.licens)}.</figcaption>`
    : "";
  const figure = imageReady(post.bild)
    ? `\n      <figure class="kn-figure">
        <img src="${escapeHtml(post.bild.src)}" alt="${escapeHtml(post.titel)}" />${credit}
      </figure>`
    : "";
  const cta = safeCta(post)
    ? `\n      <p class="kn-cta"><a href="${escapeHtml(post.cta.url)}">${escapeHtml(post.cta.text)}</a></p>`
    : "";
  const tags = post.taggar.length
    ? `\n      <p class="kn-tags">${post.taggar.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</p>`
    : "";
  const blocks = [renderKulturarv(post), renderMar(post)].filter(Boolean);
  const disclaimer = disclaimerFor(section, post);
  const disclaimerHtml = disclaimer ? `\n      <p class="kn-disclaimer">${escapeHtml(disclaimer)}</p>` : "";
  const main = `      <p class="kn-kicker">${escapeHtml(categoryLabel(section, post.kategori))} · ${escapeHtml(swedishDate(post.datum || post.publiceras))}</p>
      <div class="kn-title-row">
        <h1>${escapeHtml(post.titel)}</h1>
        ${ad}
      </div>${badge}${disclaimerHtml}
      <p class="kn-meta">${escapeHtml(post.forfattare)}</p>${figure}
      <article class="kn-article">
          ${renderBlocks(post.body)}
      </article>${cta}${tags}
      ${blocks.join("\n      ")}`;
  return layout({
    section,
    title: `${post.titel} · ${section.namn}`,
    description: post.sammanfattning || section.beskrivning,
    canonical: `${origin}${section.route}${post.slug}/`,
    main,
    home: false,
    lang: post.sprak || "sv",
  });
}

export function renderFeed(section, posts) {
  const items = posts
    .map((post) => `    <item>
      <title>${escapeXml(post.titel)}</title>
      <link>${escapeXml(origin)}${escapeXml(section.route)}${escapeXml(post.slug)}/</link>
      <guid>${escapeXml(origin)}${escapeXml(section.route)}${escapeXml(post.slug)}/</guid>
      <pubDate>${escapeXml(post.publiceras)}</pubDate>
      <category>${escapeXml(categoryLabel(section, post.kategori))}</category>
      <description>${escapeXml(post.sammanfattning)}</description>
    </item>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(section.namn)}</title>
    <link>${escapeXml(origin)}${escapeXml(section.route)}</link>
    <description>${escapeXml([section.beskrivning, disclaimerFor(section)].filter(Boolean).join(" "))}</description>
    <language>sv</language>
${items}
  </channel>
</rss>
`;
}

export function renderSitemap(section, posts) {
  const urls = [
    `  <url><loc>${escapeXml(origin)}${escapeXml(section.route)}</loc></url>`,
    ...posts.map((post) => {
      const lastmod = /^\d{4}-\d{2}-\d{2}/.test(post.datum) ? post.datum.slice(0, 10) : post.publiceras.slice(0, 10);
      return `  <url><loc>${escapeXml(origin)}${escapeXml(section.route)}${escapeXml(post.slug)}/</loc><lastmod>${escapeXml(lastmod)}</lastmod></url>`;
    }),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
}

export function renderSection(section, posts, now = new Date()) {
  const published = selectPublished(posts, now);
  return {
    published,
    index: renderIndex(section, published),
    feed: renderFeed(section, published),
    sitemap: renderSitemap(section, published),
    posts: published.map((post) => ({ slug: post.slug, html: renderPost(section, post) })),
  };
}

function clearGeneratedPosts(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "inlagg") continue;
    fs.rmSync(path.join(dir, entry.name), { recursive: true, force: true });
  }
}

export function writeSection(dir, section, posts, now = new Date()) {
  fs.mkdirSync(dir, { recursive: true });
  clearGeneratedPosts(dir);
  const rendered = renderSection(section, posts, now);
  fs.writeFileSync(path.join(dir, "index.html"), rendered.index);
  fs.writeFileSync(path.join(dir, "feed.xml"), rendered.feed);
  fs.writeFileSync(path.join(dir, "sitemap.xml"), rendered.sitemap);
  for (const post of rendered.posts) {
    const folder = path.join(dir, post.slug);
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, "index.html"), post.html);
  }
  return rendered;
}

export function buildAll({ root = repoRoot, now = new Date(), ids = null } = {}) {
  const report = [];
  for (const section of Object.values(sections)) {
    if (ids && !ids.includes(section.id)) continue;
    const dir = path.join(root, section.dir);
    const rendered = writeSection(dir, section, loadPosts(dir), now);
    report.push({
      id: section.id,
      namn: section.namn,
      slugs: rendered.published.map((post) => post.slug),
    });
  }
  return report;
}

export function extractLinks(text) {
  const links = [];
  const pattern = /\b(?:href|src)\s*=\s*"([^"]*)"/g;
  for (const match of String(text).matchAll(pattern)) links.push(match[1]);
  return links;
}

export function normalizeLink(link) {
  if (link === origin || link.startsWith(`${origin}/`)) {
    const rest = link.slice(origin.length);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return link;
}

export function internalExists(root, url) {
  const clean = String(url).split("#")[0].split("?")[0];
  if (!clean.startsWith("/")) return false;
  let rel = clean.replace(/^\/+/, "");
  try {
    rel = decodeURIComponent(rel);
  } catch {
    return false;
  }
  if (rel.includes("..")) return false;
  const abs = path.normalize(path.join(root, rel));
  if (abs !== root && !abs.startsWith(`${root}${path.sep}`)) return false;
  if (clean.endsWith("/") || rel === "") {
    return fs.existsSync(path.join(abs, "index.html"));
  }
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return true;
  if (fs.existsSync(path.join(abs, "index.html"))) return true;
  return false;
}

export function sourcesHeadingOutsideMar(html) {
  const outside = String(html).replace(/<aside class="kn-mar"[\s\S]*?<\/aside>/gi, "");
  return /<h[1-6][^>]*>\s*Källor\s*<\/h[1-6]>/i.test(outside) || /^#{1,6}\s+Källor\s*$/im.test(outside);
}

export function reviewOutput(text, file, root) {
  const failures = [];
  const warnings = [];
  if (/magasinet/iu.test(text)) failures.push(`${file}: innehåller blockerat ord`);
  if (TIMEZONE.test(text)) failures.push(`${file}: tidszonsetikett`);
  for (const pattern of NOT_ADVICE) {
    if (pattern.test(text)) {
      failures.push(`${file}: innehåller formulering om att texten inte är råd`);
      break;
    }
  }
  for (const [pattern, label] of INTERNAL_NOTE) {
    if (pattern.test(text)) failures.push(`${file}: innehåller ${label}`);
  }
  if (sourcesHeadingOutsideMar(text)) failures.push(`${file}: rubriken Källor utanför MAR-rutan`);
  for (const raw of extractLinks(text)) {
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("data:")) continue;
    const link = normalizeLink(raw);
    if (/^https?:\/\//i.test(link) || link.startsWith("//")) {
      warnings.push(`${file}: extern länk ${raw}`);
      continue;
    }
    if (link.startsWith("/") && !internalExists(root, link)) {
      failures.push(`${file}: bruten intern länk ${raw}`);
    }
  }
  return { failures, warnings };
}

export function listGenerated(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const name of ["index.html", "feed.xml", "sitemap.xml"]) {
    const full = path.join(dir, name);
    if (fs.existsSync(full)) files.push(full);
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "inlagg") continue;
    const html = path.join(dir, entry.name, "index.html");
    if (fs.existsSync(html)) files.push(html);
  }
  return files;
}

export function checkRepo(root = repoRoot) {
  const failures = [];
  const warnings = [];
  for (const section of Object.values(sections)) {
    const dir = path.join(root, section.dir);
    for (const post of loadPosts(dir)) {
      for (const issue of reviewPost(post, section)) {
        const line = `${path.relative(root, post.file)}: ${issue.message}`;
        if (issue.level === "fail") failures.push(line);
        else warnings.push(line);
      }
    }
    const generated = listGenerated(dir);
    if (!generated.some((file) => file.endsWith(`${path.sep}index.html`) && path.dirname(file) === dir)) {
      failures.push(`${section.dir}/index.html saknas (kör build)`);
    }
    for (const file of generated) {
      const text = fs.readFileSync(file, "utf8");
      const rel = path.relative(root, file);
      const output = reviewOutput(text, rel, root);
      failures.push(...output.failures);
      warnings.push(...output.warnings.map((warning) => warning.replace(`${rel}: extern länk `, "extern länk: ")));
    }
    const proposal = path.join(dir, "amnesforslag.md");
    if (fs.existsSync(proposal)) {
      const blob = generated.map((file) => fs.readFileSync(file, "utf8")).join("\n");
      if (blob.includes("amnesforslag.md") || blob.includes("ENDAST-FORSLAG-PUBLICERAS-INTE")) {
        failures.push(`${section.dir}: amnesforslag.md har renderats`);
      }
    }
  }
  return { failures: [...new Set(failures)], warnings: [...new Set(warnings)] };
}
