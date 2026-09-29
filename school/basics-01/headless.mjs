/**
 * Headless check that lesson 01 no longer renders its own MP4.
 * Usage: node school/basics-01/headless.mjs http://127.0.0.1:3456
 */
import { writeFileSync, mkdirSync } from "node:fs";

const base = (process.argv[2] || "http://127.0.0.1:3456").replace(/\/$/, "");
const outDir = process.argv[3] || "/tmp/basics-01-check";
mkdirSync(outDir, { recursive: true });

const chrome = await fetch("http://127.0.0.1:9222/json/version").then((r) => r.json());
const browser = new WebSocket(chrome.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  browser.onopen = resolve;
  browser.onerror = reject;
});

let seq = 0;
const pending = new Map();
browser.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
};
function send(method, params = {}, sessionId) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    browser.send(JSON.stringify(payload));
  });
}

const logs = [];
browser.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.method === "Runtime.consoleAPICalled") {
    const text = (msg.params.args || [])
      .map((a) => a.value ?? a.description ?? a.type)
      .join(" ");
    logs.push({ sessionId: msg.sessionId, type: msg.params.type, text });
  }
  if (msg.method === "Runtime.exceptionThrown") {
    logs.push({
      sessionId: msg.sessionId,
      type: "exception",
      text: msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text || "exception",
    });
  }
});

async function newSession() {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  await send("Network.enable", {}, sessionId);
  await send("Network.setCacheDisabled", { cacheDisabled: true }, sessionId);
  return { sessionId, targetId };
}

function evaluate(sessionId, expression) {
  return send(
    "Runtime.evaluate",
    { expression, returnByValue: true, awaitPromise: true },
    sessionId,
  ).then((result) => {
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || "evaluate failed");
    }
    return result.result.value;
  });
}

async function openLesson(lang, lesson) {
  const { sessionId, targetId } = await newSession();
  const before = logs.length;
  await send(
    "Page.addScriptToEvaluateOnNewDocument",
    {
      source: `localStorage.setItem("ig.app.language", ${JSON.stringify(JSON.stringify(lang))});`,
    },
    sessionId,
  );
  await send("Page.navigate", { url: `${base}/tradingskolan?lesson=${lesson}` }, sessionId);
  const deadline = Date.now() + 15000;
  let ready = null;
  while (Date.now() < deadline) {
    ready = await evaluate(sessionId, `(() => {
      const root = document.querySelector(".trade-skolan");
      const heading = document.querySelector("h2");
      if (!root || !heading) return null;
      return heading.textContent || "";
    })()`);
    if (ready) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  if (!ready) throw new Error(`${lang} ${lesson}: page did not render`);
  await new Promise((r) => setTimeout(r, 600));
  const snap = await evaluate(sessionId, `(() => {
    const videos = [...document.querySelectorAll("video")].map(v => v.currentSrc || v.src || "");
    const iframes = [...document.querySelectorAll("iframe")].map(f => f.src || "");
    const own = document.querySelector(".ts-own-video");
    const media = [...document.querySelectorAll(".ts-lesson-media")].map(el => ({
      cls: el.className,
      h: Math.round(el.getBoundingClientRect().height),
    }));
    const summary = document.querySelector(".ts-summary")?.textContent || "";
    const cardSummary = document.querySelector(".ts-mod-summary")?.textContent || "";
    const headings = [...document.querySelectorAll(".ts-content-heading")].map(el => el.textContent);
    const topicLine = document.querySelector(".ts-mod-summary")?.nextElementSibling?.textContent || "";
    const summaryEl = document.querySelector(".ts-summary");
    const contentEl = document.querySelector(".ts-content");
    const between = [];
    if (summaryEl && contentEl) {
      let n = summaryEl.nextElementSibling;
      while (n && n !== contentEl && between.length < 6) {
        const r = n.getBoundingClientRect();
        between.push({ cls: n.className, h: Math.round(r.height) });
        n = n.nextElementSibling;
      }
    }
    summaryEl?.scrollIntoView({ block: "start" });
    return { videos, iframes, hasOwn: !!own, media, summary, cardSummary, headings: headings.slice(0, 3), topicLine, between };
  })()`);
  await new Promise((r) => setTimeout(r, 200));
  const shot = await send("Page.captureScreenshot", { format: "png" }, sessionId);
  const file = `${outDir}/${lang}-${lesson}.png`;
  writeFileSync(file, Buffer.from(shot.data, "base64"));
  const errors = logs.slice(before).filter((l) => l.sessionId === sessionId && (l.type === "error" || l.type === "exception" || l.type === "assert"));
  await send("Target.closeTarget", { targetId });
  return { lang, lesson, ready, ...snap, errors, screenshot: file };
}

const cases = [
  ["sv", "basics-01-samma-sprak"],
  ["en", "basics-01-samma-sprak"],
  ["uk", "basics-01-samma-sprak"],
  ["sv", "basics-03-ranta-pa-ranta"],
];

const results = [];
for (const [lang, lesson] of cases) results.push(await openLesson(lang, lesson));
console.log(JSON.stringify(results, null, 2));
browser.close();
