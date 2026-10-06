import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import test from "node:test";
import baseline from "./baseline-correct.json" with { type: "json" };

const bundle = fs.readFileSync(new URL("../../assets/index-CBayL6Go.js", import.meta.url), "utf8");

function braceSlice(source, start) {
  const open = source[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (char === "`" || char === '"' || char === "'") {
      const quote = char;
      i += 1;
      while (i < source.length && source[i] !== quote) {
        if (source[i] === "\\") i += 1;
        i += 1;
      }
      continue;
    }
    if (char === open) depth += 1;
    else if (char === close) {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unclosed ${open}`);
}

function arrayAt(token) {
  const at = bundle.indexOf(token);
  assert.notEqual(at, -1, token);
  return braceSlice(bundle, bundle.indexOf("[", at));
}

const helper = (id, text, correct, textEn, textUk) => ({ id, text, correct: !!correct, textEn, textUk });
const scope = { xs: helper, Cs: helper, Ts: helper, Ds: helper, ks: helper };
function evaluate(token, extra = {}) {
  const names = [...Object.keys(scope), ...Object.keys(extra)];
  const values = [...Object.values(scope), ...Object.values(extra)];
  return new Function(...names, `return ${arrayAt(token)}`)(...values);
}

const As = evaluate("var As=[");
const Ss = evaluate("var Ss=[");
const ws = evaluate("var ws=[");
const Es = evaluate("var Es=[");
const Os = evaluate("var Os=[");
const js = evaluate("js=[{moduleId:`trading-intro`", { As });
const bankMods = evaluate(",bankMods=[");
const mfMods = evaluate(",mfMods=[");
const Ms = evaluate(",Ms=[", { Ss, js, Os, ws, Es, bankMods, mfMods });

const added = {
  havstang: 1,
  "stop-loss": 1,
  "take-profit": 1,
  signaler: 1,
  analys: 2,
  kalender: 1,
  "eu-syd-01-bors": 1,
  "eu-syd-02-bostad": 1,
};

const extraCorrect = {
  "hav-extra-q1": "c",
  "sl-extra-q1": "a",
  "tp-extra-q1": "d",
  "sig-extra-q1": "b",
  "an-extra-q1": "c",
  "an-extra-q2": "a",
  "kal-extra-q1": "b",
  "eus1-extra-q1": "d",
  "eus2-extra-q1": "c",
};

function lessons() {
  const available = new Set(Ms.filter((course) => course.status === "available").map((course) => course.courseId));
  const byCourse = {
    "basics-sprak": Ss,
    "trading-grund": js,
    ipo: Os,
    "europa-syd": ws,
    historia: Es,
    "bankernas-historia": bankMods,
    "marknadens-framtid": mfMods,
  };
  const rows = [];
  for (const [courseId, modules] of Object.entries(byCourse)) {
    if (!available.has(courseId)) continue;
    for (const module of modules) rows.push({ courseId, module });
  }
  return rows;
}

test("every available lesson quiz has the expected count, four options and one correct answer", () => {
  const rows = lessons();
  assert.equal(rows.length, 34);
  for (const { module } of rows) {
    const quiz = module.quiz || [];
    const before = baseline.counts[module.moduleId];
    const expectCount = before + (added[module.moduleId] || 0);
    assert.equal(quiz.length, expectCount, module.moduleId);
    if (module.moduleId === "kunskapstest") assert.equal(quiz.length, 11);
    else {
      assert.ok(quiz.length >= 3 && quiz.length <= 6, `${module.moduleId} ${quiz.length}`);
    }
    for (const question of quiz) {
      assert.equal(question.options.length, 4, question.id);
      assert.equal(question.options.filter((option) => option.correct).length, 1, question.id);
      assert.ok(question.prompt && question.explanation, question.id);
      assert.ok(question.promptEn && question.promptUk, `${question.id} i18n prompt`);
      assert.ok(question.explanationEn && question.explanationUk, `${question.id} i18n explanation`);
      for (const option of question.options) {
        assert.ok(option.text && option.textEn && option.textUk, `${question.id} ${option.id}`);
      }
      const letter = question.options.find((option) => option.correct).id;
      const expected = baseline.correct[question.id] || extraCorrect[question.id];
      assert.equal(letter, expected, question.id);
    }
  }
  assert.equal(As.length, 11);
});

test("lesson 1 owns the 1:2 ratio question and the RaceX unlock store", () => {
  assert.equal(Math.round((1 / (1 + 2)) * 1000) / 10, 33.3);
  assert.equal(Math.round((1 / (1 + 1.5)) * 1000) / 10, 40);
  const lesson = Ss.find((module) => module.moduleId === "basics-01-samma-sprak");
  const ratio = lesson.quiz.find((question) => question.id === "bas1-ratio");
  assert.ok(ratio, "bas1-ratio");
  assert.equal(ratio.options.find((option) => option.correct).id, "b");
  assert.match(ratio.explanation, /1\/\(1\+2\)/);
  assert.match(ratio.explanation, /40 %/);
  assert.match(bundle, /localStorage\.setItem\(`tr\.riskplan\.unlock`/);
  assert.match(bundle, /quizId:`bas1-ratio`/);
  assert.match(
    bundle,
    /ue\.module\.moduleId===`basics-01-samma-sprak`&&e>=70&&Array\.isArray\(n\)&&n\.some\(e=>e\.id===`bas1-ratio`&&e\.correct\)/,
  );
  assert.equal(bundle.includes("hist4-ratio-q1"), false);
  assert.equal(bundle.includes("hist4-ratio-q2"), false);
  assert.equal(bundle.includes("ratioQuizPassed"), false);
  const hist = Es.find((module) => module.moduleId === "hist-04-risk-sl-tp");
  assert.equal(hist.quiz.some((question) => String(question.id).startsWith("hist4-ratio")), false);
  assert.equal(hist.quiz.length, baseline.counts["hist-04-risk-sl-tp"]);
});

test("the old daily quiz is not mounted and the quiz patch stays idempotent", () => {
  assert.equal(bundle.includes("(0,X.jsx)(Yce,{date:te})"), false);
  assert.match(bundle, /function localizeLessonQuiz\(/);
  assert.equal(execSync("node school/quiz/patch-bundle.mjs", { encoding: "utf8" }).includes("quiz patch wrote"), true);
});
