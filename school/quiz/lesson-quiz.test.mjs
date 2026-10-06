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
  "hist-04-risk-sl-tp": 2,
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
  "hist4-ratio-q1": "b",
  "hist4-ratio-q2": "c",
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

test("the ratio lesson states the break-even math and the ratio questions", () => {
  assert.equal(Math.round((1 / (1 + 2)) * 1000) / 10, 33.3);
  assert.equal(Math.round((1 / (1 + 1.5)) * 1000) / 10, 40);
  const lesson = Es.find((module) => module.moduleId === "hist-04-risk-sl-tp");
  assert.equal(lesson.quiz.length, 5);
  const ratio = lesson.quiz.filter((question) => question.id.startsWith("hist4-ratio-"));
  assert.deepEqual(ratio.map((question) => question.id), ["hist4-ratio-q1", "hist4-ratio-q2"]);
  assert.match(bundle, /33,3 procent/);
  assert.match(bundle, /40 procent/);
  assert.match(bundle, /33\.3 percent/);
  assert.match(bundle, /40 percent/);
  const second = ratio[1].options.find((option) => option.correct);
  assert.match(second.text, /33,3 procent för 1:2/);
  assert.match(second.text, /40 procent för 1:1\.5/);
});

test("school progress keeps ratioQuizPassed and the old daily quiz is not mounted", () => {
  const mergeStart = bundle.indexOf("function mergeSchoolProgress");
  const readStart = bundle.indexOf("function readSchoolProgress");
  const mergeSchoolProgress = new Function(`${bundle.slice(mergeStart, readStart)} return mergeSchoolProgress;`)();
  const readSchoolProgress = new Function(
    "ca",
    `${bundle.slice(readStart, bundle.indexOf("function dpe", readStart))} return readSchoolProgress;`,
  );
  const saved = mergeSchoolProgress(
    [{ userId: "u", moduleId: "hist-04-risk-sl-tp", status: "in_progress", progressPercent: 40, ratioQuizPassed: true }],
    [{ userId: "u", moduleId: "hist-04-risk-sl-tp", status: "completed", progressPercent: 100 }],
  );
  assert.equal(saved[0].ratioQuizPassed, true);
  assert.equal(saved[0].status, "completed");
  const storage = {
    "school.progress.u": [
      { userId: "u", moduleId: "hist-04-risk-sl-tp", status: "completed", progressPercent: 100, ratioQuizPassed: true },
    ],
  };
  const loaded = readSchoolProgress((key) => storage[key])("u");
  assert.equal(loaded[0].ratioQuizPassed, true);
  assert.match(bundle, /hist4-ratio-q1/);
  assert.match(bundle, /hist4-ratio-q2/);
  assert.equal(bundle.includes("(0,X.jsx)(Yce,{date:te})"), false);
  assert.match(bundle, /function localizeLessonQuiz\(/);
  assert.equal(execSync("node school/quiz/patch-bundle.mjs", { encoding: "utf8" }).includes("quiz patch wrote"), true);
});
