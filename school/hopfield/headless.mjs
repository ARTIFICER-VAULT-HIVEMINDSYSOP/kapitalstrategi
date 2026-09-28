/**
 * Headless check for the Hopfield lesson.
 * Uses system Chrome via puppeteer-core (NODE_PATH must include it).
 *
 *   npm install --prefix /tmp/puppeteer-run puppeteer-core
 *   node school/hopfield/headless.mjs
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire("/tmp/puppeteer-run/package.json");
const puppeteer = require("puppeteer-core");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const shotDir = "/opt/cursor/artifacts";
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
};

function startServer() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    const rel = url.endsWith("/") ? `${url}index.html` : url;
    let file = path.normalize(path.join(root, rel));
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      if (path.extname(rel)) {
        res.writeHead(404);
        res.end("missing");
        return;
      }
      file = path.join(root, "index.html");
    }
    res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

const CORRECT = [
  "Ett nät av binära neuroner (+1/−1) med symmetriska vikter, där mönster är stabila tillstånd",
  "wᵢⱼ är summan över mönster av xᵢ·xⱼ, och diagonalen är 0",
  "En ofullständig eller brusig ledtråd kan hämta hela mönstret",
  "Ungefär 0,14·N mönster ryms. För många blandar minnen. Kontrollera mönstret mot data och regler innan ett beslut",
  "Boltzmann-maskinen (1985, med Ackley och Sejnowski) har stokastiska neuroner och dolda enheter, så nätet lär sig känna igen och generera mönster. Hinton bidrog också till backpropagation (1986)",
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const server = await startServer();
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;
fs.mkdirSync(shotDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(25000);
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("trycloudflare.com")) {
      req.respond({ status: 404, contentType: "application/json", body: "{}" });
      return;
    }
    if (url.includes("fonts.googleapis") || url.includes("fonts.gstatic") || url.includes("youtube")) {
      req.abort();
      return;
    }
    req.continue();
  });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem(
      "ig.auth.session",
      JSON.stringify({
        userId: "skolelev",
        name: "Skolelev",
        email: "skolelev@example.com",
        loggedInAt: "2026-09-28T09:00:00.000Z",
      }),
    );
  });

  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${base}/tradingskolan?course=trading-grund&lesson=hopfield-minne`, { waitUntil: "networkidle0" });

  await page.waitForSelector("iframe.hopfield-frame");
  const heading = await page.$eval(".ts-main h3", (el) => el.textContent);
  assert(heading.includes("Minne och mönsterigenkänning"), `lesson heading missing: ${heading}`);
  const lessonText = await page.$eval(".ts-content", (el) => el.innerText);
  assert(lessonText.includes("Geoffrey Hinton"), "Hinton section missing");
  assert(lessonText.includes("Boltzmann-maskinen"), "Boltzmann machine missing");
  assert(lessonText.indexOf("Hopfield") < lessonText.indexOf("Geoffrey Hinton"), "Hinton section is not after Hopfield");
  const wiki = await page.$eval('a[href="https://en.wikipedia.org/wiki/Geoffrey_Hinton"]', (el) => el.getAttribute("href"));
  assert(wiki.includes("Geoffrey_Hinton"), "Wikipedia link missing");

  const lastChip = await page.$$eval(".ts-path-chip-label", (els) => els.map((el) => el.textContent));
  assert(lastChip.at(-1).includes("18 · Minne och mönster"), `path does not end with the new lesson: ${lastChip.at(-1)}`);
  const nextLabel = await page.$eval(".ts-path-chip.is-next .ts-path-chip-label", (el) => el.textContent);
  assert(nextLabel.includes("1 · Historia: skepp"), `empty progress should point at lesson 1, got ${nextLabel}`);

  const frame = page.frames().find((f) => f.url().includes("/school/hopfield/"));
  assert(frame, "demo frame missing");
  await frame.waitForSelector("#hopfield-demo");
  await frame.click('button[data-pattern="up"]');
  await frame.$eval("#hopfield-noise", (el) => {
    el.value = "20";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const noise = await frame.$eval("#hopfield-demo", (el) => el.dataset.noise);
  assert(noise === "20", `noise was ${noise}`);
  await frame.click("#hopfield-recall");
  await frame.waitForFunction(() => {
    const demo = document.querySelector("#hopfield-demo");
    return demo && demo.dataset.stable === "true" && demo.dataset.running === "false";
  });
  const recalled = await frame.$eval("#hopfield-demo", (el) => ({
    match: el.dataset.match,
    energy: el.dataset.energy,
    steps: el.dataset.steps,
    status: document.querySelector("#hopfield-status").textContent,
  }));
  assert(recalled.match === "exact", `20% noise did not recall: ${JSON.stringify(recalled)}`);
  assert(Number(recalled.steps) >= 1, "recall took no steps");
  assert(Number(recalled.energy) < 0, `energy not shown as a valley: ${recalled.energy}`);

  await page.setViewport({ width: 390, height: 844 });
  await frame.waitForSelector(".hf-cell");
  const cell = await frame.$eval(".hf-cell", (el) => {
    const r = el.getBoundingClientRect();
    return { w: r.width, h: r.height };
  });
  const grid = await frame.$eval(".hf-grid", (el) => el.getBoundingClientRect().width);
  assert(grid <= 390, `grid wider than phone: ${grid}`);
  assert(cell.w >= 20 && cell.h >= 20, `cell too small: ${cell.w}x${cell.h}`);
  const recallBox = await frame.$eval("#hopfield-recall", (el) => el.getBoundingClientRect().height);
  assert(recallBox >= 40, `recall button not finger-sized: ${recallBox}`);

  await page.setViewport({ width: 1100, height: 900 });
  await frame.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const demo = await frame.$("#hopfield-demo");
  await demo.screenshot({ path: path.join(shotDir, "hopfield-demo.png") });

  await frame.click("#hopfield-store");
  await frame.waitForFunction(() => document.querySelector("#hopfield-demo").dataset.stored === "24");
  await frame.click("#hopfield-recall");
  await frame.waitForFunction(() => {
    const demo = document.querySelector("#hopfield-demo");
    return demo && demo.dataset.stable === "true" && demo.dataset.running === "false";
  });
  const crowded = await frame.$eval("#hopfield-demo", (el) => el.dataset.match);
  assert(crowded !== "exact", `overfull net still recalled exactly: ${crowded}`);

  await frame.click("#hopfield-reset");
  await frame.waitForFunction(() => document.querySelector("#hopfield-demo").dataset.stored === "4");

  for (let q = 0; q < CORRECT.length; q++) {
    const text = CORRECT[q];
    await page.waitForFunction((needle) => {
      return [...document.querySelectorAll(".ts-quiz-option span")].some((el) => el.textContent.includes(needle));
    }, {}, text);
    await page.evaluate((needle) => {
      const span = [...document.querySelectorAll(".ts-quiz-option span")].find((el) => el.textContent.includes(needle));
      span.closest("label").querySelector("input").click();
    }, text);
    await page.waitForFunction(() => {
      const btn = document.querySelector(".ts-quiz button.btn.primary");
      return btn && !btn.disabled;
    });
    await page.click(".ts-quiz button.btn.primary");
  }
  await page.waitForFunction(() => document.body.innerText.includes("100%") || document.querySelector(".ts-quiz-result-block"));
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ig.school.progress.skolelev") || "[]"));
  const row = saved.find((item) => item.moduleId === "hopfield-minne");
  assert(row, `progress not saved: ${JSON.stringify(saved)}`);
  assert(row.status === "completed", `status ${row.status}`);
  assert(row.progressPercent >= 70, `percent ${row.progressPercent}`);

  await page.evaluate(() => {
    const rows = [
      {
        userId: "skolelev",
        moduleId: "hist-01-skepp-till-aktier",
        moduleTitle: "01 · Från skepp till aktier",
        status: "completed",
        progressPercent: 100,
      },
    ];
    localStorage.setItem("ig.school.progress.skolelev", JSON.stringify(rows));
  });
  await page.goto(`${base}/tradingskolan`, { waitUntil: "networkidle0" });
  await page.waitForSelector(".ts-path-chip.is-next");
  const unlocked = await page.$eval(".ts-path-chip.is-next .ts-path-chip-label", (el) => el.textContent);
  assert(unlocked.includes("2 · Historia: guld"), `lesson 1 did not unlock lesson 2: ${unlocked}`);
  await page.evaluate(() => document.querySelector(".ts-path-chip.is-next").click());
  try {
    await page.waitForFunction(() => location.search.includes("hist-02-guld-korsfarare"), { timeout: 8000 });
  } catch (err) {
    const href = await page.evaluate(() => location.href);
    const open = await page.$eval("details.ts-path-fold", (el) => el.open);
    throw new Error(`lesson 2 did not open from ${href}; path details open=${open}; ${err.message}`);
  }
  const second = await page.$eval(".ts-main h3", (el) => el.textContent);
  assert(!second.includes("Hopfield") && !second.includes("Minne och mönster"), `opened the wrong lesson: ${second}`);

  const fatal = errors.filter((e) => /SyntaxError|is not defined|is not a function/i.test(e));
  assert(fatal.length === 0, `page errors: ${fatal.join(" | ")}`);
  console.log(JSON.stringify({
    ok: true,
    heading,
    recalled,
    crowded,
    saved: row,
    unlocked,
    second,
    url: `${base}/tradingskolan?course=trading-grund&lesson=hopfield-minne`,
  }, null, 2));
} finally {
  await browser.close();
  server.close();
}
