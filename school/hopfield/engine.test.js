import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  BASE_PATTERNS,
  CAPACITY_FACTOR,
  N,
  applyNoise,
  capacity,
  classify,
  energiesDecrease,
  energy,
  hebbWeights,
  mulberry32,
  noiseSeed,
  recall,
  randomPattern,
} from "./engine.js";
import { lesson, pathStep } from "./lesson.js";

const base = BASE_PATTERNS.map((p) => p.state);
const weights = hebbWeights(base);

test("Hebb weights are symmetric with a zero diagonal", () => {
  let manual = 0;
  for (const p of base) manual += p[0] * p[1];
  assert.equal(weights[0][1], manual);
  assert.equal(weights[1][0], manual);
  for (let i = 0; i < N; i++) assert.equal(weights[i][i], 0);
  for (let i = 0; i < N; i += 7) {
    for (let j = 0; j < N; j += 5) assert.equal(weights[i][j], weights[j][i]);
  }
});

test("energy falls and 20% noise recalls each stored pattern", () => {
  assert.equal(Math.round(capacity() * 100) / 100, Math.round(CAPACITY_FACTOR * N * 100) / 100);
  for (const p of BASE_PATTERNS) {
    const noisy = applyNoise(p.state, 0.2, mulberry32(noiseSeed(p.id, 20)));
    const flipped = noisy.reduce((n, v, i) => n + (v !== p.state[i] ? 1 : 0), 0);
    assert.equal(flipped, 20);
    const result = recall(weights, noisy);
    assert.equal(result.stable, true);
    assert.equal(energiesDecrease(result.energies), true);
    assert.ok(result.energies.at(-1) <= result.energies[0]);
    assert.deepEqual(classify(result.state, BASE_PATTERNS), { kind: "exact", id: p.id });
    assert.equal(energy(weights, result.state) < 0, true);
  }
});

test("storing past capacity turns the same 20% cue into a false memory", () => {
  const cue = applyNoise(BASE_PATTERNS[0].state, 0.2, mulberry32(noiseSeed("up", 20)));
  const patterns = base.slice();
  const rng = mulberry32(20240928);
  for (let i = 0; i < 20; i++) patterns.push(randomPattern(rng));
  assert.ok(patterns.length > capacity());
  const crowded = hebbWeights(patterns);
  const result = recall(crowded, cue);
  assert.equal(result.stable, true);
  assert.equal(energiesDecrease(result.energies), true);
  const kind = classify(result.state, BASE_PATTERNS);
  assert.notEqual(kind.kind, "exact");
});

test("lesson copy stays inside the school rules and is translated", () => {
  const blobs = [
    lesson.summary,
    lesson.summaryEn,
    lesson.summaryUk,
    ...lesson.content,
    ...lesson.contentEn,
    ...lesson.contentUk,
    ...lesson.quiz.flatMap((q) => [q.prompt, q.promptEn, q.promptUk, q.explanation, q.explanationEn, q.explanationUk]),
  ];
  const joined = blobs.join("\n").toLowerCase();
  for (const banned of ["riskprofil", "lämplighet", "lamplighet", "suitability", "risk profile", "livehandel", "live trading"]) {
    assert.equal(joined.includes(banned), false, banned);
  }
  assert.equal(lesson.quiz.length, 5);
  assert.ok(lesson.content.some((line) => line.startsWith("# Geoffrey Hinton")));
  assert.ok(lesson.contentEn.some((line) => line.startsWith("# Geoffrey Hinton")));
  assert.ok(lesson.contentUk.some((line) => line.startsWith("# Джеффрі Гінтон")));
  assert.ok(lesson.content.includes("https://en.wikipedia.org/wiki/Geoffrey_Hinton"));
  assert.ok(lesson.content.includes("@hopfield"));
  assert.ok(lesson.content.includes("@quiet"));
  assert.ok(lesson.content.includes("https://www.pnas.org/doi/10.1073/pnas.79.8.2554"));
  assert.ok(lesson.content.includes("https://www.nobelprize.org/prizes/physics/2024/press-release/"));
  assert.equal(pathStep.moduleId, lesson.moduleId);
  assert.equal(pathStep.phase, "advanced");
});

test("the Vite bundle lists the lesson last on the trading path", () => {
  const bundle = fs.readFileSync(new URL("../../assets/index-CBayL6Go.js", import.meta.url), "utf8");
  const moduleAt = bundle.indexOf('"moduleId":"hopfield-minne"');
  const pathAt = bundle.indexOf('"id":"path-hopfield"');
  assert.ok(moduleAt > 0);
  assert.ok(pathAt > moduleAt);
  assert.ok(bundle.includes(lesson.moduleTitle));
  assert.ok(bundle.includes("hopfield-frame"));
  const pathEnd = bundle.indexOf("];function Hc");
  assert.ok(pathAt < pathEnd);
  assert.equal(bundle.slice(pathAt, pathEnd).includes('"moduleId":"ipo-01'), false);
});
