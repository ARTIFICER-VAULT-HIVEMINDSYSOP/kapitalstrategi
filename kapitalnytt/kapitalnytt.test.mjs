import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, test } from "node:test";
import {
  FINANCE_DISCLAIMER,
  attributionRequired,
  buildAll,
  checkRepo,
  hasCoordinates,
  isPublished,
  loadPosts,
  parsePost,
  renderPost,
  renderSection,
  repoRoot,
  reviewOutput,
  reviewPost,
  sections,
  stockholmStamp,
} from "./engine.mjs";

const blocked = ["magasin", "et"].join("");

function scalar(value) {
  if (typeof value === "boolean") return value ? "true" : "false";
  const text = String(value);
  if (text === "" || /[:#]/.test(text) || text.startsWith("[") || text.startsWith('"') || text.includes(":")) {
    return JSON.stringify(text);
  }
  return text;
}

function yaml(fields, indent = 0) {
  const pad = " ".repeat(indent);
  return Object.entries(fields)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        if (!value.length) return `${pad}${key}: []`;
        return `${pad}${key}:\n${value.map((item) => `${pad}  - ${scalar(item)}`).join("\n")}`;
      }
      if (value && typeof value === "object") {
        return `${pad}${key}:\n${yaml(value, indent + 2)}`;
      }
      return `${pad}${key}: ${scalar(value)}`;
    })
    .join("\n");
}

function md(overrides = {}, body = "Brödtext utan siffror och utan order.") {
  const fields = {
    titel: "Provtitel",
    datum: "2026-10-02",
    publiceras: "2026-10-02T06:47",
    status: "godkand",
    forfattare: "Redaktionen",
    sammanfattning: "Kort sammanfattning utan löfte.",
    kategori: "kapitalallokering",
    taggar: ["prov"],
    sprak: "sv",
    data: "ingen",
    kallor: [],
    koppling: "ingen",
    marknadsforing: false,
    finans: true,
    ...overrides,
  };
  return `---\n${yaml(fields)}\n---\n\n${body}\n`;
}

function failures(post, section = sections.kapitalnytt) {
  return reviewPost(post, section)
    .filter((issue) => issue.level === "fail")
    .map((issue) => issue.message);
}

describe("sektioner", { concurrency: false }, () => {
  test("utkast, framtid och förfallen tid", () => {
    const now = new Date("2026-10-02T12:00:00Z");
    for (const section of Object.values(sections)) {
      const kategori = Object.keys(section.kategorier)[0];
      const posts = [
        parsePost(md({ status: "utkast", publiceras: "2020-01-01T00:00", titel: "Dolt utkast", kategori, finans: false }), "inlagg/dolt.md"),
        parsePost(md({ status: "godkand", publiceras: "2026-10-03T06:47", titel: "Framtida text", kategori, finans: false }), "inlagg/framtida.md"),
        parsePost(md({ status: "godkand", publiceras: "2026-10-02T06:47", titel: "Synlig text", kategori, finans: section.finansAlltid }), "inlagg/synlig.md"),
      ];
      const rendered = renderSection(section, posts, now);
      const blob = [rendered.index, rendered.feed, rendered.sitemap, ...rendered.posts.map((post) => post.html)].join("\n");
      assert.equal(rendered.published.map((post) => post.slug).join(","), "synlig");
      assert.match(blob, /Synlig text/);
      assert.doesNotMatch(blob, /Dolt utkast/);
      assert.doesNotMatch(blob, /Framtida text/);
      assert.doesNotMatch(blob, /inte investeringsrådgivning/);
      assert.doesNotMatch(blob, /personlig rådgivning/);
      assert.doesNotMatch(blob, /<h2>Källor<\/h2>/);
      if (section.finansAlltid) assert.match(rendered.posts[0].html, /kn-disclaimer/);
      else assert.doesNotMatch(rendered.posts[0].html, /kn-disclaimer/);
    }
  });

  test("publiceras tolkas i Europe/Stockholm", () => {
    const summer = new Date("2026-10-02T06:45:00Z");
    assert.equal(stockholmStamp(summer), "2026-10-02T08:45");
    assert.equal(isPublished({ status: "godkand", publiceras: "2026-10-02T08:30" }, summer), true);
    assert.equal(isPublished({ status: "godkand", publiceras: "2026-10-02T08:50" }, summer), false);
    const winter = new Date("2026-01-15T06:45:00Z");
    assert.equal(stockholmStamp(winter), "2026-01-15T07:45");
  });

  test("MAR-information krävs för marknadsanalys", () => {
    const missing = parsePost(md({
      kategori: "marknadsanalys",
      data: "SIMULERAD",
      kallor: ["Exempelkälla"],
      titel: "Sektorläge",
    }));
    assert.ok(failures(missing).some((message) => message.includes("MAR-information")));
    const draft = parsePost(md({
      status: "utkast",
      kategori: "marknadsanalys",
      data: "SIMULERAD",
      kallor: [],
      titel: "Sektorläge",
    }));
    const draftIssues = reviewPost(draft, sections.kapitalnytt);
    assert.ok(draftIssues.every((issue) => issue.level === "warn"));
    assert.ok(draftIssues.some((issue) => issue.message.includes("MAR-information")));
    const ready = parsePost(md({
      kategori: "marknadsanalys",
      data: "SIMULERAD",
      kallor: ["Exempelkälla"],
      mar: {
        upphov: "Redaktionen",
        framstalld: "2026-10-02T06:47",
        spridd: "2026-10-02T07:05",
        metod: "Genomgång av öppna källor",
        intressekonflikter: "Inga kända",
        innehav: "Inga",
      },
    }));
    assert.equal(failures(ready).some((message) => message.includes("MAR-information")), false);
    const oneTime = parsePost(md({
      kategori: "marknadsanalys",
      data: "SIMULERAD",
      kallor: ["Exempelkälla"],
      mar: {
        upphov: "Redaktionen",
        framstalld: "2026-10-02T06:47",
        metod: "Genomgång av öppna källor",
        intressekonflikter: "Inga kända",
        innehav: "Inga",
      },
    }));
    assert.ok(failures(oneTime).some((message) => message.includes("spridd")));
    const html = renderPost(sections.kapitalnytt, ready);
    assert.match(html, /MAR-information/);
    assert.match(html, /<dt>Framställd<\/dt>[\s\S]*<dd>2026-10-02T06:47<\/dd>/);
    assert.match(html, /<dt>Först spridd<\/dt>[\s\S]*<dd>2026-10-02T07:05<\/dd>/);
    assert.match(html, /Exempelkälla/);
    assert.match(html, /kn-mar-risk/);
    assert.equal(html.match(/class="kn-mar"/g).length, 1);
    assert.ok(html.indexOf("kn-article") < html.indexOf("kn-mar"));
    assert.doesNotMatch(html, /<h2>Källor<\/h2>/);
    assert.doesNotMatch(html, /class="kn-disclaimer"/);
    assert.doesNotMatch(html, /\b(?:CET|CEST|UTC|GMT)\b/);
    const sourced = parsePost(md({
      titel: "Berg",
      kategori: "ravaror-och-kretslopp",
      finans: false,
      kallor: ["SGU"],
    }, "Urberget är grunden."));
    const quiet = renderPost(sections.urbergsskolden, sourced);
    assert.doesNotMatch(quiet, /<h2>Källor<\/h2>/);
    assert.doesNotMatch(quiet, />SGU</);
  });

  test("cta utan etiketten Marknadsföring faller", () => {
    const bare = parsePost(md({
      cta: { text: "Läs mer om utbildningen", url: "/skola/riskhantering/" },
      marknadsforing: false,
      koppling: "utbildning",
    }));
    assert.ok(failures(bare).some((message) => message.includes("Marknadsföring")));
    const htmlBare = renderPost(sections.kapitalnytt, bare);
    assert.match(htmlBare, /kn-title-row[\s\S]*Marknadsföring/);
    assert.doesNotMatch(htmlBare, /href="\/skola\/riskhantering\/"/);
    const marked = parsePost(md({
      cta: { text: "Läs mer om utbildningen", url: "/skola/riskhantering/" },
      marknadsforing: true,
      koppling: "utbildning",
    }));
    assert.equal(failures(marked).some((message) => message.includes("Marknadsföring")), false);
    const html = renderPost(sections.kapitalnytt, marked);
    assert.match(html, /class="kn-title-row"[\s\S]*<h1>[\s\S]*Marknadsföring/);
    assert.match(html, /href="\/skola\/riskhantering\/"/);
    const external = parsePost(md({
      cta: { text: "Läs mer", url: "https://example.com/info" },
      marknadsforing: true,
    }));
    assert.ok(failures(external).some((message) => message.includes("extern")));
  });

  test("avkastningsord utan riskord i samma mening fångas", () => {
    const bad = parsePost(md({}, "Förväntad avkastning är hög."));
    assert.ok(failures(bad).some((message) => message.includes("avkastningsord utan riskord")));
    const good = parsePost(md({}, "Avkastning kan utebli när risken gör att värdet sjunker."));
    assert.equal(failures(good).some((message) => message.includes("avkastningsord utan riskord")), false);
    const promise = parsePost(md({}, "Det här är en garanterad vinst."));
    assert.ok(failures(promise).some((message) => message.includes("vinstlöfte")));
  });

  test("amnesforslag.md renderas aldrig", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "sektion-"));
    const dir = path.join(root, "kapitalnytt");
    fs.mkdirSync(path.join(dir, "inlagg"), { recursive: true });
    fs.writeFileSync(path.join(dir, "amnesforslag.md"), "ENDAST-FORSLAG-PUBLICERAS-INTE hemlig vinkel\n");
    fs.writeFileSync(path.join(dir, "inlagg", "synlig.md"), md({ titel: "Synlig text", status: "godkand" }));
    fs.writeFileSync(path.join(dir, "inlagg", "dold.md"), md({ titel: "Dold text", status: "utkast", publiceras: "2020-01-01T00:00" }));
    const report = buildAll({ root, now: new Date("2026-10-02T12:00:00Z"), ids: ["kapitalnytt"] });
    assert.deepEqual(report[0].slugs, ["synlig"]);
    const files = ["index.html", "feed.xml", "sitemap.xml", path.join("synlig", "index.html")];
    for (const name of files) {
      const text = fs.readFileSync(path.join(dir, name), "utf8");
      assert.equal(text.includes("ENDAST-FORSLAG-PUBLICERAS-INTE"), false);
      assert.equal(text.includes("amnesforslag"), false);
      assert.equal(text.includes("Dold text"), false);
      assert.equal(text.includes(blocked), false);
    }
    assert.match(fs.readFileSync(path.join(dir, "index.html"), "utf8"), /Synlig text/);
    assert.equal(fs.existsSync(path.join(dir, "dold")), false);
  });

  test("koordinater i fornminnen fångas", () => {
    assert.equal(hasCoordinates("Hågahögen ligger i Uppland och är en bronsåldershög."), false);
    assert.equal(hasCoordinates("Inga koordinater och ingen vägbeskrivning."), false);
    const samples = [
      "59.8212, 17.5021",
      "59°49'16\"N",
      "RT90 6639000 1602000",
      "SWEREF99 TM 6639000 647000",
      "nordkoordinat 6639000",
      "lat: 59.8212",
    ];
    for (const sample of samples) {
      assert.equal(hasCoordinates(sample), true, sample);
      const post = parsePost(md({
        titel: "Hög",
        kategori: "historia-och-fornminnen",
        finans: false,
        kallor: ["Riksantikvarieämbetet"],
        kulturarv: { lamning: "Hågahögen", kanslig: false },
      }, sample), "inlagg/hog.md");
      assert.ok(failures(post, sections.urbergsskolden).some((message) => message.includes("koordinater")), sample);
      const draft = parsePost(md({
        status: "utkast",
        titel: "Hög",
        kategori: "historia-och-fornminnen",
        finans: false,
        kulturarv: { lamning: "Hågahögen", kanslig: false },
      }, sample));
      assert.ok(reviewPost(draft, sections.urbergsskolden).every((issue) => issue.level === "warn"));
    }
    const clean = parsePost(md({
      titel: "Hågahögen utan position",
      kategori: "historia-och-fornminnen",
      finans: false,
      kallor: ["Riksantikvarieämbetet, Fornsök"],
      kulturarv: { lamning: "Hågahögen", kanslig: false },
    }, "En känd hög, beskriven utan positionsuppgifter."));
    assert.equal(failures(clean, sections.urbergsskolden).some((message) => message.includes("koordinater")), false);
  });

  test("finansflaggan styr disclaimer", () => {
    const heritage = parsePost(md({
      titel: "Berg",
      kategori: "ravaror-och-kretslopp",
      finans: false,
      kallor: ["SGU"],
    }, "Urberget är grunden under landskapet."));
    const heritageHtml = renderPost(sections.urbergsskolden, heritage);
    assert.doesNotMatch(heritageHtml, /kn-disclaimer/);
    assert.doesNotMatch(heritageHtml, /personlig rådgivning/);
    assert.doesNotMatch(heritageHtml, /<h2>Källor<\/h2>/);
    const finance = parsePost(md({
      titel: "Berg och kapital",
      kategori: "ravaror-och-kretslopp",
      finans: true,
      kallor: ["SGU"],
    }, "En placering kan tappa värde, och risken ska vara synlig."));
    const financeHtml = renderPost(sections.urbergsskolden, finance);
    assert.match(financeHtml, /värdet kan både stiga och sjunka/);
    assert.doesNotMatch(financeHtml, /personlig rådgivning/);
    assert.doesNotMatch(financeHtml, /inte investeringsrådgivning/);
    assert.equal(FINANCE_DISCLAIMER.includes("värdet kan både stiga och sjunka"), true);
    assert.equal(attributionRequired("CC BY 4.0"), true);
    assert.equal(attributionRequired("CC BY-SA 4.0"), true);
    assert.equal(attributionRequired("Unsplash License"), false);
  });

  test("bild kräver credit och licens", () => {
    const incomplete = parsePost(md({
      bild: { status: "godkand", kalla: "unsplash", credit: "", licens: "", src: "https://images.unsplash.com/photo" },
    }));
    assert.ok(failures(incomplete).some((message) => message.includes("credit")));
    assert.doesNotMatch(renderPost(sections.kapitalnytt, incomplete), /<figure/);
    const hiddenCredit = parsePost(md({
      bild: {
        status: "godkand",
        kalla: "unsplash",
        credit: "Foto Namn",
        licens: "Unsplash License",
        src: "https://images.unsplash.com/photo",
      },
    }));
    const hiddenHtml = renderPost(sections.kapitalnytt, hiddenCredit);
    assert.match(hiddenHtml, /<img/);
    assert.doesNotMatch(hiddenHtml, /kn-credit/);
    const ready = parsePost(md({
      bild: {
        status: "godkand",
        kalla: "wikimedia",
        credit: "Foto Namn",
        licens: "CC BY-SA 4.0",
        src: "https://upload.wikimedia.org/example.jpg",
      },
    }));
    const html = renderPost(sections.kapitalnytt, ready);
    assert.match(html, /kn-credit/);
    assert.match(html, /Foto Namn/);
    assert.match(html, /CC BY-SA 4.0/);
  });

  test("utmärkelse får inte kallas licens", () => {
    const bad = parsePost(md({ koppling: "utbildning" }, "Utbildningens utmärkelse är en licens."));
    assert.ok(failures(bad).some((message) => message.includes("utmärkelse")));
    const good = parsePost(md({ koppling: "utbildning" }, "En utmärkelse från en kurs är inte en licens eller auktorisation."));
    assert.equal(failures(good).some((message) => message.includes("utmärkelse")), false);
  });

  test("blockerat ord, tidszon och brutna länkar", () => {
    const word = parsePost(md({}, `Text om ${blocked}.`));
    assert.ok(failures(word).some((message) => message.includes("blockerat ord")));
    const zone = parsePost(md({}, "Klockan 06:47 CET börjar dagen."));
    assert.ok(failures(zone).some((message) => message.includes("tidszon")));
    const broken = reviewOutput('<a href="/saknas-helt/">x</a>', "prov.html", repoRoot);
    assert.ok(broken.failures.some((message) => message.includes("bruten intern länk")));
    const external = reviewOutput('<a href="https://example.com/kalla">x</a>', "prov.html", repoRoot);
    assert.equal(external.failures.length, 0);
    assert.ok(external.warnings.some((message) => message.includes("extern länk")));
    const stamped = reviewOutput("<p>06:47 GMT</p>", "prov.html", repoRoot);
    assert.ok(stamped.failures.some((message) => message.includes("tidszon")));
    const advice = reviewOutput("<p>Detta är inte investeringsrådgivning.</p>", "prov.html", repoRoot);
    assert.ok(advice.failures.some((message) => message.includes("inte är råd")));
    const sources = reviewOutput("<h2>Källor</h2>", "prov.html", repoRoot);
    assert.ok(sources.failures.some((message) => message.includes("Källor")));
    const inside = reviewOutput('<aside class="kn-mar"><h2>Källor</h2><p>SGU</p></aside>', "prov.html", repoRoot);
    assert.equal(inside.failures.some((message) => message.includes("Källor")), false);
    const notes = reviewOutput("<p>TODO och internt</p>", "prov.html", repoRoot);
    assert.ok(notes.failures.some((message) => message.includes("TODO")));
    assert.ok(notes.failures.some((message) => message.includes("internt")));
  });

  test("frön är utkast och sidorna länkar inte till varandra", () => {
    const titles = {
      kapitalnytt: [
        "Fyra frågor innan kapitalet fördelas",
        "Ombalansering – vad det är och varför det diskuteras",
        "Tillväxt och värde – två sätt att se på bolag, med risken att värdet sjunker",
        "Sektoröversikt: vad som rör sig och varför (mall)",
        "Från kurs till kunskap – vad en utbildning i riskhantering ger",
      ],
      urbergsskolden: [
        "Hågahögen – vad en bronsåldershög berättar om värde",
        "Jakten som kretslopp – vilt, mark och ansvar",
        "Från berg till bruk – råvarukedjan i Härjedalen",
        "Fem sätt att tänka energieffektivt hemma och i företaget",
      ],
    };
    for (const [id, expected] of Object.entries(titles)) {
      const posts = loadPosts(path.join(repoRoot, sections[id].dir));
      assert.deepEqual(posts.map((post) => post.titel).sort(), [...expected].sort());
      assert.ok(posts.every((post) => post.status === "utkast"));
      const proposal = fs.readFileSync(path.join(repoRoot, sections[id].dir, "amnesforslag.md"), "utf8");
      assert.match(proposal, /ENDAST-FORSLAG-PUBLICERAS-INTE/);
      assert.match(proposal, /renderas inte/);
    }
    const sector = loadPosts(path.join(repoRoot, "kapitalnytt")).find((post) => post.kategori === "marknadsanalys");
    assert.equal(sector.data, "SIMULERAD");
    assert.deepEqual(sector.kallor, []);
    assert.equal(sector.mar.upphov, "[FYLLS I]");
    assert.equal(sector.mar.framstalld, "[FYLLS I]");
    assert.equal(sector.mar.spridd, "[FYLLS I]");
    const school = loadPosts(path.join(repoRoot, "kapitalnytt")).find((post) => post.kategori === "begrepp-skola");
    assert.equal(school.koppling, "utbildning");
    assert.equal(school.marknadsforing, true);
    assert.equal(school.cta.url, "/skola/riskhantering/");
    const energy = loadPosts(path.join(repoRoot, "urbergsskolden")).find((post) => post.kategori === "energi-och-resurshushallning");
    assert.equal(energy.data, "ingen");
    const report = buildAll({ now: new Date("2026-10-02T12:00:00Z") });
    assert.ok(report.every((section) => section.slugs.length === 0));
    const result = checkRepo();
    assert.deepEqual(result.failures, [], result.failures.join("\n"));
    const postWarnings = result.warnings.filter((warning) => warning.includes("/inlagg/"));
    assert.equal(postWarnings.some((warning) => warning.includes("Tillväxt och värde")), false);
    assert.equal(postWarnings.some((warning) => warning.includes("avkastningsord")), false);
    assert.ok(postWarnings.some((warning) => warning.includes("saknar kallor")));
    const kapital = fs.readFileSync(path.join(repoRoot, "kapitalnytt/index.html"), "utf8");
    const urberg = fs.readFileSync(path.join(repoRoot, "urbergsskolden/index.html"), "utf8");
    assert.match(kapital, /Inga publicerade inlägg ännu/);
    assert.match(urberg, /Inga publicerade inlägg ännu/);
    assert.match(kapital, /värdet kan både stiga och sjunka/);
    assert.doesNotMatch(kapital, /personlig rådgivning/);
    assert.doesNotMatch(kapital, /inte investeringsrådgivning/);
    assert.doesNotMatch(urberg, /kn-disclaimer/);
    assert.match(urberg, /fennoskandiska urbergsskölden/);
    assert.doesNotMatch(urberg, /angivna källor/);
    assert.equal(kapital.includes("/urbergsskolden"), false);
    assert.equal(kapital.includes("Urbergsskölden"), false);
    assert.equal(urberg.includes("/kapitalnytt"), false);
    assert.equal(urberg.includes("Kapitalnytt"), false);
    assert.equal(kapital.includes("ENDAST-FORSLAG-PUBLICERAS-INTE"), false);
    assert.equal(urberg.includes("ENDAST-FORSLAG-PUBLICERAS-INTE"), false);
    assert.equal(kapital.includes(blocked), false);
    assert.equal(urberg.includes(blocked), false);
    for (const section of Object.values(sections)) {
      for (const slug of Object.keys(section.kategorier)) {
        assert.match(fs.readFileSync(path.join(repoRoot, section.dir, "index.html"), "utf8"), new RegExp(`data-filter="${slug}"`));
      }
    }
  });

  test("cli", () => {
    const check = spawnSync(process.execPath, ["kapitalnytt/check.mjs"], { cwd: repoRoot, encoding: "utf8" });
    assert.equal(check.status, 0, check.stdout + check.stderr);
    assert.match(check.stdout, /kontroll ok/);
    const build = spawnSync(process.execPath, ["kapitalnytt/build.mjs"], { cwd: repoRoot, encoding: "utf8" });
    assert.equal(build.status, 0, build.stdout + build.stderr);
    assert.match(build.stdout, /Kapitalnytt[\s\S]*\(inga\)/);
    assert.match(build.stdout, /Urbergsskölden[\s\S]*\(inga\)/);
  });
});
