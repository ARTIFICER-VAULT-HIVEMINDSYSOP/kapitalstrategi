import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  addCalendarDays,
  calendarDate,
  emptyState,
  milestoneLine,
  newestQuizEdition,
  readState,
  recipeIssues,
  reconcileStreak,
  recordCompletion,
  sectionOrder,
  writeState,
} from "./news-quiz.mjs";

const quiz = JSON.parse(fs.readFileSync(new URL("../../nyheter/data/2026-09-28/quiz.json", import.meta.url), "utf8"));

function memory(initial = null) {
  const bag = new Map();
  if (initial != null) bag.set("ks.newsQuiz.v1", initial);
  return {
    getItem(key) {
      return bag.has(key) ? bag.get(key) : null;
    },
    setItem(key, value) {
      bag.set(key, String(value));
    },
  };
}

test("the 28 September news quiz follows the recipe", () => {
  assert.deepEqual(recipeIssues(quiz), []);
  assert.equal(quiz.questions.length >= 3 && quiz.questions.length <= 5, true);
  const positions = quiz.questions.map((question) => question.options.findIndex((option) => option.correct));
  assert.equal(new Set(positions).size > 1, true);
  const text = JSON.stringify(quiz);
  assert.match(text, /enligt|Enligt|according to the card|According to/i);
  assert.match(text, /inte ett köp|not a buy/);
  assert.match(text, /inte ett omdöme|not a verdict/);
  assert.equal(quiz.date, "2026-09-28");
});

test("streak math uses the local calendar day", () => {
  assert.equal(calendarDate(new Date("2026-10-06T21:30:00Z")), "2026-10-06");
  assert.equal(calendarDate(new Date("2026-10-06T22:30:00Z")), "2026-10-07");
  assert.equal(addCalendarDays("2026-10-06", 1), "2026-10-07");
  assert.equal(addCalendarDays("2026-03-29", 1), "2026-03-30");

  let state = emptyState();
  let step = recordCompletion(state, "2026-10-01");
  assert.equal(step.state.streak, 1);
  assert.equal(step.state.best, 1);
  step = recordCompletion(step.state, "2026-10-01");
  assert.equal(step.delta, 0);
  assert.equal(step.state.streak, 1);

  step = recordCompletion(step.state, "2026-10-02");
  assert.equal(step.state.streak, 2);
  assert.equal(step.state.best, 2);

  const quiet = reconcileStreak(step.state, "2026-10-05");
  assert.equal(quiet.streak, 0);
  assert.equal(quiet.best, 2);
  assert.equal(quiet.lastDoneDate, "2026-10-02");

  step = recordCompletion(step.state, "2026-10-05");
  assert.equal(step.state.streak, 1);
  assert.equal(step.state.best, 2);
});

test("milestones unlock once at 3, 7, 14 and 30", () => {
  let state = emptyState();
  const seen = [];
  let day = "2026-01-01";
  for (let count = 1; count <= 30; count += 1) {
    const step = recordCompletion(state, day);
    state = step.state;
    seen.push(...step.newlyUnlocked);
    assert.equal(state.streak, count);
    day = addCalendarDays(day, 1);
  }
  assert.deepEqual(seen, ["news-3", "news-7", "news-14", "news-30"]);
  const again = recordCompletion(state, addCalendarDays("2026-01-01", 29));
  assert.deepEqual(again.newlyUnlocked, []);
  assert.equal(again.delta, 0);
  assert.match(milestoneLine(1, "sv"), /2 dagar kvar till märket Nyhetsläsare 3/);
  assert.match(milestoneLine(2, "en"), /1 day left until the mark News reader 3/);
});

test("corrupt or missing storage falls back to an empty streak", () => {
  assert.equal(readState(null).streak, 0);
  assert.equal(readState(memory("{")).streak, 0);
  assert.equal(readState(memory("null")).streak, 0);
  assert.equal(readState(memory(JSON.stringify({ streak: "x", best: -3, lastDoneDate: "nope" }))).streak, 0);
  const stored = writeState(memory(), { streak: 4, best: 9, lastDoneDate: "2026-10-06", doneDates: ["2026-10-06"], unlocked: ["news-3", "nope"] });
  assert.equal(stored.streak, 4);
  assert.deepEqual(stored.unlocked, ["news-3"]);
});

test("the visible quiz is the newest edition that has one, after that edition's cards", () => {
  const older = { date: "2026-09-28", quiz: { questions: [{ id: "a" }] } };
  const newerWithout = { date: "2026-10-02" };
  const chosen = newestQuizEdition([newerWithout, older]);
  assert.equal(chosen.date, "2026-09-28");
  assert.deepEqual(sectionOrder(older, chosen.date), ["cards", "quiz"]);
  assert.deepEqual(sectionOrder(newerWithout, chosen.date), ["cards"]);
});
