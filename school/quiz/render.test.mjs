import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import test from "node:test";
import { addCalendarDays, calendarDate } from "./news-quiz.mjs";

const repo = path.resolve(new URL("../..", import.meta.url).pathname);
const shots = "/opt/cursor/artifacts/screenshots";
const chromeBin = "/usr/bin/google-chrome";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};

function startServer() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    const decoded = decodeURIComponent(url.pathname);
    const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
    const file = path.resolve(repo, relative);
    if (!file.startsWith(repo)) {
      response.writeHead(403);
      response.end();
      return;
    }
    fs.stat(file, (error, stat) => {
      const ext = path.extname(file);
      const send = (target) => {
        response.writeHead(200, { "content-type": types[path.extname(target)] || "application/octet-stream" });
        fs.createReadStream(target).pipe(response);
      };
      if (!error && stat.isDirectory()) {
        send(path.join(file, "index.html"));
        return;
      }
      if (!error && stat.isFile()) {
        send(file);
        return;
      }
      if (!ext || ext === ".html") {
        send(path.join(repo, "index.html"));
        return;
      }
      response.writeHead(404);
      response.end("missing");
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, port: address.port });
    });
  });
}

function startChrome() {
  const profile = "/tmp/chrome-quiz-6ce1";
  fs.rmSync(profile, { recursive: true, force: true });
  const child = spawn(chromeBin, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--remote-debugging-port=9334",
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: "ignore" });
  return child;
}

async function debuggerSocket() {
  const started = Date.now();
  while (Date.now() - started < 15000) {
    try {
      const response = await fetch("http://127.0.0.1:9334/json/list");
      if (response.ok) {
        const pages = await response.json();
        const page = pages.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
        if (page) return page.webSocketDebuggerUrl;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("chrome debugger did not open");
}

function cdp(url) {
  const ws = new WebSocket(url);
  let next = 0;
  const pending = new Map();
  const opened = new Promise((resolve, reject) => {
    ws.addEventListener("open", () => resolve());
    ws.addEventListener("error", () => reject(new Error("cdp socket failed")));
  });
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const done = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) done.reject(new Error(JSON.stringify(message.error)));
      else done.resolve(message.result);
    }
  });
  return {
    opened,
    send(method, params = {}) {
      const id = ++next;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    close() {
      ws.close();
    },
  };
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) {
    const detail = result.exceptionDetails.exception?.description || result.exceptionDetails.text || "evaluate failed";
    throw new Error(detail);
  }
  return result.result?.value;
}

async function waitFor(client, expression, timeout = 20000) {
  const started = Date.now();
  let last = "";
  while (Date.now() - started < timeout) {
    try {
      const value = await evaluate(client, expression);
      if (value) return value;
    } catch (error) {
      last = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  let body = last;
  try {
    body = await evaluate(client, "document.body ? location.href + '\\n' + document.body.innerText.slice(0, 500) : ''");
  } catch {}
  throw new Error(`timeout: ${expression}\n${body}`);
}

async function shot(client, file, clip) {
  const params = { format: "png", captureBeyondViewport: true };
  if (clip) params.clip = { ...clip, scale: 1 };
  const image = await client.send("Page.captureScreenshot", params);
  fs.mkdirSync(shots, { recursive: true });
  fs.writeFileSync(path.join(shots, file), Buffer.from(image.data, "base64"));
}

async function setSize(client, width) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height: width > 600 ? 900 : 844,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
}

test("lesson quiz, news quiz and streak render in Swedish and English", { timeout: 120000 }, async () => {
  assert.equal(fs.existsSync(chromeBin), true);
  const { server, port } = await startServer();
  const chrome = startChrome();
  const origin = `http://127.0.0.1:${port}`;
  let client;
  try {
    client = cdp(await debuggerSocket());
    await client.opened;
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    const today = calendarDate(new Date());
    const yesterday = addCalendarDays(today, -1);
    const earlier = addCalendarDays(today, -2);

    for (const lang of ["sv", "en"]) {
      await setSize(client, 1280);
      await client.send("Page.navigate", { url: `${origin}/tradingskolan?course=basics-sprak&lesson=basics-01-samma-sprak` });
      await waitFor(client, "document.querySelector('#root') && document.querySelector('#root').childElementCount > 0");
      await evaluate(client, `localStorage.setItem('ig.app.language', JSON.stringify(${JSON.stringify(lang)}))`);
      await client.send("Page.reload", { ignoreCache: true });
      const lessonPrompt = lang === "en" ? "What is a share, in short?" : "Vad är en aktie, i korta ord?";
      await waitFor(client, `document.body.innerText.includes(${JSON.stringify(lessonPrompt)})`);
      const lessonBox = await evaluate(client, `(() => {
        const el = document.querySelector('.ts-quiz');
        const rect = el.getBoundingClientRect();
        return { x: Math.max(0, rect.left + window.scrollX - 12), y: Math.max(0, rect.top + window.scrollY - 12), width: Math.min(window.innerWidth, rect.width + 24), height: Math.min(rect.height + 24, 720) };
      })()`);
      await shot(client, `lesson-quiz-${lang}-1280.png`, lessonBox);
      await setSize(client, 390);
      const lessonNarrow = await evaluate(client, `(() => {
        const el = document.querySelector('.ts-quiz');
        el.scrollIntoView({ block: 'start' });
        const rect = el.getBoundingClientRect();
        return { x: 0, y: Math.max(0, rect.top + window.scrollY - 8), width: 390, height: Math.min(rect.height + 16, 780) };
      })()`);
      await shot(client, `lesson-quiz-${lang}-390.png`, lessonNarrow);

      await setSize(client, 1280);
      const seed = JSON.stringify({
        lastDoneDate: yesterday,
        streak: 2,
        best: 2,
        doneDates: [earlier, yesterday],
        unlocked: [],
      });
      await evaluate(client, `localStorage.setItem('ks.newsQuiz.v1', ${JSON.stringify(seed)})`);
      await client.send("Page.navigate", { url: `${origin}/nyheter` });
      await waitFor(client, "document.querySelector('#dagens-quiz .ts-quiz-prompt')");
      const placement = await evaluate(client, `(() => {
        const grid = document.querySelector('.ks-mod-grid');
        const quiz = document.querySelector('#dagens-quiz');
        const heading = document.querySelector('#ks-news-quiz-heading')?.textContent || '';
        const date = document.querySelector('.dnq-date')?.textContent || '';
        const follows = !!(grid && quiz && (grid.compareDocumentPosition(quiz) & Node.DOCUMENT_POSITION_FOLLOWING));
        return { follows, heading, date, cards: grid ? grid.children.length : 0 };
      })()`);
      assert.equal(placement.follows, true, "quiz follows the cards");
      assert.equal(placement.cards, 6);
      assert.match(placement.heading, lang === "en" ? /News quiz/ : /Nyhetsquiz/);
      assert.match(placement.date, lang === "en" ? /Edition/ : /Utgåva/);
      assert.equal(/dagens|today'?s/i.test(placement.heading + placement.date), false);
      const newsBox = await evaluate(client, `(() => {
        const quiz = document.querySelector('#dagens-quiz');
        const top = quiz.getBoundingClientRect().top + window.scrollY;
        return { x: 0, y: Math.max(0, top - 340), width: window.innerWidth, height: 860 };
      })()`);
      await shot(client, `news-quiz-${lang}-1280.png`, newsBox);
      await setSize(client, 390);
      const newsNarrow = await evaluate(client, `(() => {
        const quiz = document.querySelector('#dagens-quiz');
        const top = quiz.getBoundingClientRect().top + window.scrollY;
        return { x: 0, y: Math.max(0, top - 560), width: 390, height: 980 };
      })()`);
      await shot(client, `news-quiz-${lang}-390.png`, newsNarrow);

      await setSize(client, 1280);
      const finished = await evaluate(client, `(() => {
        const root = document.querySelector('#dagens-quiz');
        return new Promise((resolve) => {
          let guard = 0;
          const step = () => {
            if (root.querySelector('.ks-quiz-teaser') || guard++ > 8) {
              const teaser = root.querySelector('.ks-quiz-teaser')?.innerText || '';
              const status = root.querySelector('.ks-quiz-status')?.innerText || '';
              resolve(status + "\\n" + teaser);
              return;
            }
            const radio = root.querySelector('input[type=radio]');
            if (!radio) { resolve('no radio ' + root.innerText.slice(0, 400)); return; }
            radio.click();
            const button = root.querySelector('button.btn.primary');
            if (!button || button.disabled) { resolve('button not ready'); return; }
            button.click();
            setTimeout(step, 40);
          };
          step();
        });
      })()`);
      assert.match(String(finished), lang === "en" ? /New quiz tomorrow/ : /Nytt quiz i morgon/);
      const done = await waitFor(client, `(() => {
        const root = document.querySelector('#dagens-quiz');
        const text = root ? root.innerText : '';
        const ready = text.includes(${JSON.stringify(lang === "en" ? "New quiz tomorrow" : "Nytt quiz i morgon")})
          && text.includes(${JSON.stringify(lang === "en" ? "Streak: 3 days" : "Svit: 3 dagar")})
          && text.includes(${JSON.stringify(lang === "en" ? "News reader 3" : "Nyhetsläsare 3")});
        return ready ? text : '';
      })()`);
      assert.match(done, /33|40|reading the news|läsa nyheten|for learning|för lärandet/);
      const streakBox = await evaluate(client, `(() => {
        const el = document.querySelector('#dagens-quiz');
        const rect = el.getBoundingClientRect();
        return { x: Math.max(0, rect.left + window.scrollX - 8), y: Math.max(0, rect.top + window.scrollY - 8), width: Math.min(window.innerWidth, rect.width + 16), height: rect.height + 16 };
      })()`);
      await shot(client, `streak-${lang}-1280.png`, streakBox);
      await setSize(client, 390);
      const streakNarrow = await evaluate(client, `(() => {
        const el = document.querySelector('#dagens-quiz');
        const rect = el.getBoundingClientRect();
        return { x: 0, y: Math.max(0, rect.top + window.scrollY - 8), width: 390, height: rect.height + 16 };
      })()`);
      await shot(client, `streak-${lang}-390.png`, streakNarrow);
      await evaluate(client, "document.querySelector('#dagens-quiz .btn.sm').click()");
      const retried = await waitFor(client, `document.querySelector('#dagens-quiz input[type=radio]') ? document.querySelector('#dagens-quiz').innerText : ''`);
      assert.match(retried, lang === "en" ? /Streak: 3 days/ : /Svit: 3 dagar/);
      assert.match(retried, /1\//);
    }
  } finally {
    client?.close();
    chrome.kill();
    await new Promise((resolve) => server.close(resolve));
  }
});
