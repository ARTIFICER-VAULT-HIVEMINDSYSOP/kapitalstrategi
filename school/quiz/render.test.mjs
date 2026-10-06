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
    body = await evaluate(
      client,
      "(() => { const radios=[...document.querySelectorAll('.ts-quiz input')]; const quiz=document.querySelector('.ts-quiz'); return location.href + '\\nradios ' + radios.length + ' disabled ' + radios.filter(r=>r.disabled).length + '\\n' + (quiz?quiz.innerText.slice(0,300):'no quiz') + '\\n' + (document.querySelector('.banner.error')?.innerText||'') })()",
    );
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

function lessonAnswers() {
  const bundle = fs.readFileSync(path.join(repo, "assets/index-CBayL6Go.js"), "utf8");
  const start = bundle.indexOf("moduleId:`basics-01-samma-sprak`");
  const end = bundle.indexOf("moduleId:`basics-03-ranta-pa-ranta`", start);
  const slice = bundle.slice(start, end);
  const answers = {};
  for (const block of slice.matchAll(/\{id:`(bas1-[a-z0-9-]+)`,[\s\S]*?options:\[([\s\S]*?)\]/g)) {
    const correct = [...block[2].matchAll(/xs\(`([a-d])`,`(?:\\`|[^`])*`,(!0|!1)/g)].find((item) => item[2] === "!0");
    if (!correct) throw new Error(`missing correct option for ${block[1]}`);
    answers[block[1]] = correct[1];
  }
  if (!answers["bas1-ratio"]) throw new Error("bas1-ratio missing from lesson 1");
  return answers;
}

async function planState(client, width) {
  await setSize(client, width);
  const raw = await waitFor(
    client,
    `(() => {
      const sl = document.querySelector('.tr-plan [data-k="sl"]');
      const tp = document.querySelector('.tr-plan [data-k="tp"]');
      const p15 = document.querySelector('.tr-plan [data-k="p15"]');
      const status = document.querySelector('.tr-plan [data-k="status"]');
      if (!sl || !tp || !p15 || !status) return '';
      return JSON.stringify({
        sl: sl.value,
        tp: tp.value,
        disabled: p15.disabled,
        status: status.textContent,
        state: sl.closest('.tr-plan').dataset.state
      });
    })()`,
  );
  return JSON.parse(raw);
}

async function shotPlan(client, file) {
  const box = await evaluate(
    client,
    `(() => {
      const el = document.querySelector('.tr-plan');
      el.scrollIntoView({ block: 'center' });
      const rect = el.getBoundingClientRect();
      return { x: Math.max(0, rect.left + window.scrollX - 8), y: Math.max(0, rect.top + window.scrollY - 8), width: Math.min(window.innerWidth, rect.width + 16), height: rect.height + 16 };
    })()`,
  );
  await shot(client, file, box);
}

test("lesson quiz, news quiz, streak and RaceX ratio lock render", { timeout: 180000 }, async () => {
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
    const answers = lessonAnswers();
    const lessonUrl = `${origin}/tradingskolan?course=basics-sprak&lesson=basics-01-samma-sprak`;

    await client.send("Page.navigate", { url: `${origin}/` });
    await waitFor(client, "document.querySelector('#root') && document.querySelector('#root').childElementCount > 0");
    await evaluate(
      client,
      `(() => {
        localStorage.setItem('ig.auth.session', JSON.stringify({ userId: 'quiz-local', name: 'Quiz', email: 'quiz@example.com', loggedInAt: '2026-10-06T00:00:00.000Z' }));
        localStorage.setItem('ig.ks.localApi.v1', JSON.stringify({ portfolios: [{ id: 'p-quiz', userId: 'quiz-local', holdings: [] }], progress: [], utr: [] }));
        localStorage.removeItem('tr.riskplan.unlock');
        localStorage.removeItem('tr.riskplan');
        localStorage.removeItem('tr.riskplan.choice');
        localStorage.removeItem('tr.riskplan.p2');
        localStorage.setItem('app.language', 'sv');
        localStorage.setItem('ig.app.language', JSON.stringify('sv'));
      })()`,
    );
    await client.send("Page.navigate", { url: `${origin}/traderider/spel/#racex` });
    const lockedWide = await planState(client, 1280);
    assert.equal(lockedWide.sl, "2");
    assert.equal(lockedWide.tp, "4");
    assert.equal(lockedWide.disabled, true);
    assert.equal(lockedWide.state, "locked");
    assert.match(lockedWide.status, /Förvalet är 1:2/);
    await shotPlan(client, "racex-locked-1280.png");
    const lockedNarrow = await planState(client, 390);
    assert.equal(lockedNarrow.sl, "2");
    assert.equal(lockedNarrow.tp, "4");
    assert.equal(lockedNarrow.disabled, true);
    assert.match(lockedNarrow.status, /1:2/);
    await shotPlan(client, "racex-locked-390.png");

    for (const lang of ["sv", "en"]) {
      await setSize(client, 1280);
      await client.send("Page.navigate", { url: lessonUrl });
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

    await setSize(client, 1280);
    await evaluate(client, `localStorage.setItem('ig.app.language', JSON.stringify('sv'))`);
    await client.send("Page.navigate", { url: lessonUrl });
    await waitFor(client, "document.querySelector('.ts-quiz input[type=radio]:not(:disabled)') ? 'ready' : ''");
    const passed = await evaluate(
      client,
      `(() => {
        const answers = ${JSON.stringify(answers)};
        const root = document.querySelector('.ts-quiz');
        return new Promise((resolve) => {
          let guard = 0;
          const step = () => {
            if (root.querySelector('.ts-quiz-result-block') || guard++ > 40) {
              const radioNow = root.querySelector('input[type=radio]');
              const name = radioNow ? radioNow.name : '';
              const expected = answers[name] || '';
              const pickNow = name ? root.querySelector('input[name="' + name + '"][value="' + expected + '"]') : null;
              const buttonNow = root.querySelector('button.btn.primary');
              resolve({
                done: !!root.querySelector('.ts-quiz-result-block'),
                unlock: localStorage.getItem('tr.riskplan.unlock'),
                name,
                expected,
                checked: !!(pickNow && pickNow.checked),
                buttonDisabled: !buttonNow || buttonNow.disabled,
                values: [...root.querySelectorAll('input[type=radio]')].map((item) => item.value + (item.checked ? '*' : '')).join(','),
                text: root.innerText.slice(0, 180)
              });
              return;
            }
            const radio = root.querySelector('input[type=radio]');
            if (!radio) { resolve({ done: false, text: 'no radio' }); return; }
            const pick = root.querySelector('input[name="' + radio.name + '"][value="' + (answers[radio.name] || '') + '"]');
            if (!pick || pick.disabled) { resolve({ done: false, text: 'disabled ' + radio.name }); return; }
            if (!pick.checked) pick.click();
            const button = root.querySelector('button.btn.primary');
            if (!button || button.disabled) { setTimeout(step, 40); return; }
            button.click();
            setTimeout(step, 40);
          };
          step();
        });
      })()`,
    );
    assert.equal(passed.done, true, JSON.stringify(passed));
    assert.equal(passed.unlock, JSON.stringify({ unlocked: true, quizId: "bas1-ratio" }));

    await client.send("Page.navigate", { url: `${origin}/traderider/spel/#racex` });
    const openWide = await planState(client, 1280);
    assert.equal(openWide.sl, "2");
    assert.equal(openWide.tp, "4");
    assert.equal(openWide.disabled, false);
    assert.equal(openWide.state, "unlocked");
    assert.match(openWide.status, /1:1,5/);
    assert.match(openWide.status, /1:2/);
    await shotPlan(client, "racex-unlocked-1280.png");
    const openNarrow = await planState(client, 390);
    assert.equal(openNarrow.disabled, false);
    assert.equal(openNarrow.sl, "2");
    assert.equal(openNarrow.tp, "4");
    assert.match(openNarrow.status, /1:1,5/);
    await shotPlan(client, "racex-unlocked-390.png");
  } finally {
    client?.close();
    chrome.kill();
    await new Promise((resolve) => server.close(resolve));
  }
});
