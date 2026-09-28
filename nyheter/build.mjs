/**
 * Bygger modulartiklar från nyheter/data/<datum>/.
 *
 * Lägg en ny utgåva som:
 *   nyheter/data/YYYY-MM-DD/edition.json
 *   nyheter/data/YYYY-MM-DD/<slug>.json
 * och kör: node nyheter/build.mjs
 *
 * edition.json: date, dateLabel, lead, signoff, siteLabel, siteHref, disclaimer, brand.
 *   Texter som kan översättas senare är objekt { sv, en?, uk? }.
 * <slug>.json: edition, date, dateLabel, slug, order, translations.{sv,en?,uk?}.{title,ingress,blocks}.
 *   blocks: [{ type: "p", text }] med **fetstil** och [etikett](url).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const dataDir = path.join(here, "data");
const origin = "https://kapitalstrategi.com";

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderInline(markdown) {
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let html = "";
  let last = 0;
  for (const match of String(markdown).matchAll(pattern)) {
    html += escapeHtml(markdown.slice(last, match.index));
    if (match[1] != null) {
      const href = match[2].trim();
      const external = /^https?:/i.test(href);
      html += `<a href="${escapeHtml(href)}"${external ? ' rel="noopener noreferrer"' : ""}>${escapeHtml(match[1])}</a>`;
    } else {
      html += `<strong>${escapeHtml(match[3])}</strong>`;
    }
    last = match.index + match[0].length;
  }
  html += escapeHtml(markdown.slice(last));
  return html;
}

export function pick(value, language = "sv") {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value[language] || value.sv || "";
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function editionDirs() {
  return fs
    .readdirSync(dataDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

function loadEdition(date) {
  const dir = path.join(dataDir, date);
  const edition = readJson(path.join(dir, "edition.json"));
  const modules = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json") && name !== "edition.json")
    .map((name) => readJson(path.join(dir, name)))
    .sort((a, b) => a.order - b.order);
  return { edition, modules };
}

function articleHtml(edition, module, modules) {
  const lang = "sv";
  const copy = module.translations[lang];
  const title = copy.title;
  const dateLabel = pick(module.dateLabel, lang);
  const disclaimer = pick(edition.disclaimer, lang);
  const brand = pick(edition.brand, lang);
  const signoff = pick(edition.signoff, lang);
  const href = `/nyheter/${edition.date}/${module.slug}/`;
  const paragraphs = copy.blocks
    .map((block) => {
      const source = /^(Källa|Källor):/.test(block.text);
      return `<p${source ? ' class="ks-source"' : ""}>${renderInline(block.text)}</p>`;
    })
    .join("\n        ");
  const siblings = modules
    .map((item) => {
      const itemTitle = item.translations[lang].title;
      if (item.slug === module.slug) {
        return `<li><span aria-current="page">${escapeHtml(itemTitle)}</span></li>`;
      }
      const itemHref = `/nyheter/${edition.date}/${item.slug}/`;
      return `<li><a href="${itemHref}">${escapeHtml(itemTitle)}</a></li>`;
    })
    .join("\n          ");

  return `<!doctype html>
<html lang="sv" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0a1628" />
    <meta name="description" content="${escapeHtml(copy.ingress)}" />
    <title>${escapeHtml(title)} · ${escapeHtml(dateLabel)} · ${escapeHtml(brand)}</title>
    <link rel="canonical" href="${origin}${href}" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="/nyheter/modul.css" />
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
    <a class="ks-skip" href="#innehall">Till innehållet</a>
    <header class="ks-top">
      <div class="ks-top-inner">
        <a class="ks-brand" href="/"><img src="/favicon.svg" alt="" width="28" height="28" /><span>${escapeHtml(brand)}</span></a>
        <nav aria-label="Sidor"><a href="/nyheter">Nyheter</a></nav>
        <button type="button" class="ks-theme" id="ks-theme">Ljust</button>
      </div>
    </header>
    <main id="innehall" class="ks-wrap">
      <p class="ks-kicker">Nyhetsbrev · ${escapeHtml(dateLabel)}</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="ks-disclaimer">${escapeHtml(disclaimer)}</p>
      <article class="ks-article">
        ${paragraphs}
      </article>
      <nav class="ks-siblings" aria-label="Moduler i utgåvan">
        <h2>I samma utgåva</h2>
        <ul>
          ${siblings}
        </ul>
      </nav>
    </main>
    <footer class="ks-foot">
      <p>${escapeHtml(signoff)}</p>
      <p><a href="${escapeHtml(edition.siteHref || "/")}">${escapeHtml(edition.siteLabel || "kapitalstrategi.com")}</a></p>
    </footer>
    <script src="/nyheter/modul.js"></script>
  </body>
</html>
`;
}

function ensureShell() {
  const indexPath = path.join(repo, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  const embedTags = `    <link rel="stylesheet" href="/nyheter/embed.css" />\n    <script defer src="/nyheter/embed.js"></script>`;
  if (!html.includes("/nyheter/embed.js")) {
    const marker = '<script defer src="/assets/traderider-demo-nav.js"></script>';
    if (!html.includes(marker)) {
      throw new Error("Hittade inte traderider-demo-nav i index.html");
    }
    html = html.replace(marker, `${marker}\n${embedTags}`);
    fs.writeFileSync(indexPath, html);
  }
  const slashFix = `    <script>
      (function () {
        var path = location.pathname;
        if (path.length > 1 && path.endsWith("/")) {
          history.replaceState(null, "", path.replace(/\\/+$/, "") + location.search + location.hash);
        }
      })();
    </script>\n`;
  let newsIndex = html.replace("<head>", `<head>\n${slashFix}`);
  fs.writeFileSync(path.join(here, "index.html"), newsIndex);
}

function main() {
  const editions = [];
  for (const date of editionDirs()) {
    const { edition, modules } = loadEdition(date);
    if (edition.date !== date) throw new Error(`Datum stämmer inte i ${date}`);
    for (const module of modules) {
      const dir = path.join(here, date, module.slug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "index.html"), articleHtml(edition, module, modules));
    }
    editions.push({
      id: edition.id || date,
      date: edition.date,
      dateLabel: edition.dateLabel,
      lead: edition.lead,
      signoff: edition.signoff,
      modules: modules.map((module) => ({
        slug: module.slug,
        order: module.order,
        href: `/nyheter/${date}/${module.slug}/`,
        title: Object.fromEntries(
          Object.entries(module.translations).map(([language, copy]) => [language, copy.title])
        ),
        ingress: Object.fromEntries(
          Object.entries(module.translations).map(([language, copy]) => [language, copy.ingress])
        ),
      })),
    });
  }
  const first = loadEdition(editionDirs()[0]).edition;
  const index = {
    brand: first.brand,
    disclaimer: first.disclaimer,
    editions,
  };
  fs.writeFileSync(path.join(dataDir, "editions.json"), JSON.stringify(index, null, 2) + "\n");
  ensureShell();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
