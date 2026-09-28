/**
 * Hopfield network (1982): binary neurons ±1, symmetric Hebbian weights,
 * asynchronous sign updates, energy that falls until a stable state.
 *
 * E = −½ Σ_ij w_ij s_i s_j
 * w_ij = Σ_μ x_i^μ x_j^μ (i ≠ j), w_ii = 0
 * s_i ← sign(Σ_j w_ij s_j); sign(0) keeps the current state
 */

export const GRID = 10;
export const N = GRID * GRID;
/** Approximate pattern capacity ≈ 0.14 N (Amit, Gutfreund, Sompolinsky). */
export const CAPACITY_FACTOR = 0.14;

export function capacity(n = N) {
  return CAPACITY_FACTOR * n;
}

export function rowsToPattern(rows) {
  if (rows.length !== GRID) throw new Error(`expected ${GRID} rows`);
  const s = new Array(N);
  for (let r = 0; r < GRID; r++) {
    const row = rows[r];
    if (row.length !== GRID) throw new Error(`row ${r} must have length ${GRID}`);
    for (let c = 0; c < GRID; c++) {
      const ch = row[c];
      s[r * GRID + c] = ch === "#" || ch === "1" || ch === "+" ? 1 : -1;
    }
  }
  return s;
}

/** Distinct, non-inverted patterns so each is its own memory. */
export const BASE_PATTERNS = [
  {
    id: "up",
    rows: [
      "....##....",
      "...####...",
      "..######..",
      "....##....",
      "....##....",
      "....##....",
      "....##....",
      "....##....",
      "..........",
      "..........",
    ],
  },
  {
    id: "down",
    rows: [
      "..........",
      "..........",
      "....##....",
      "....##....",
      "....##....",
      "....##....",
      "..######..",
      "...####...",
      "....##....",
      "..######..",
    ],
  },
  {
    id: "line",
    rows: [
      "..........",
      "..........",
      "..........",
      "##########",
      "##########",
      "..........",
      "..........",
      "..........",
      "..........",
      "..........",
    ],
  },
  {
    id: "h",
    rows: [
      "##......##",
      "##......##",
      "##......##",
      "##########",
      "##########",
      "##......##",
      "##......##",
      "##......##",
      "##......##",
      "##......##",
    ],
  },
].map((p) => ({ id: p.id, state: rowsToPattern(p.rows) }));

export function cloneState(s) {
  return s.slice();
}

export function hebbWeights(patterns) {
  const w = Array.from({ length: N }, () => new Float64Array(N));
  for (const p of patterns) {
    for (let i = 0; i < N; i++) {
      const xi = p[i];
      for (let j = i + 1; j < N; j++) {
        const v = xi * p[j];
        w[i][j] += v;
        w[j][i] += v;
      }
    }
  }
  return w;
}

export function energy(w, s) {
  let acc = 0;
  for (let i = 0; i < N; i++) {
    let h = 0;
    const row = w[i];
    const si = s[i];
    for (let j = 0; j < N; j++) h += row[j] * s[j];
    acc += si * h;
  }
  return -0.5 * acc;
}

export function localField(w, s, i) {
  const row = w[i];
  let h = 0;
  for (let j = 0; j < N; j++) h += row[j] * s[j];
  return h;
}

/**
 * Flip the next unstable neuron, scanning from startIndex.
 * Returns the same array reference only when already stable; otherwise a copy.
 */
export function stepOnce(w, s, startIndex = 0) {
  for (let k = 0; k < N; k++) {
    const i = (startIndex + k) % N;
    const h = localField(w, s, i);
    if (h === 0) continue;
    const sgn = h > 0 ? 1 : -1;
    if (s[i] !== sgn) {
      const next = s.slice();
      next[i] = sgn;
      return { state: next, flipped: i, stable: false, nextIndex: (i + 1) % N };
    }
  }
  return { state: s, flipped: -1, stable: true, nextIndex: startIndex % N };
}

export function recall(w, state, maxSteps = N * 8) {
  let s = state.slice();
  let idx = 0;
  const energies = [energy(w, s)];
  for (let n = 0; n < maxSteps; n++) {
    const r = stepOnce(w, s, idx);
    if (r.stable) return { state: s, steps: n, energies, stable: true };
    s = r.state;
    idx = r.nextIndex;
    const e = energy(w, s);
    energies.push(e);
  }
  return { state: s, steps: maxSteps, energies, stable: false };
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function noiseSeed(patternId, percent) {
  let h = 2166136261;
  const id = String(patternId);
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (h ^ Math.round(percent * 1000) * 997) >>> 0;
}

/** Flip round(rate * N) neurons. rate is 0–1. Deterministic for a given rng. */
export function applyNoise(pattern, rate, rng) {
  const s = pattern.slice();
  const flips = Math.max(0, Math.min(N, Math.round(N * rate)));
  const order = Array.from({ length: N }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  for (let k = 0; k < flips; k++) s[order[k]] *= -1;
  return s;
}

export function randomPattern(rng) {
  const s = new Array(N);
  for (let i = 0; i < N; i++) s[i] = rng() < 0.5 ? -1 : 1;
  return s;
}

export function overlap(a, b) {
  let same = 0;
  for (let i = 0; i < a.length; i++) if (a[i] === b[i]) same++;
  return same / a.length;
}

export function classify(state, originals) {
  let best = null;
  for (const p of originals) {
    const same = overlap(state, p.state);
    const inverted = overlap(state, p.state.map((v) => -v));
    if (same === 1) return { kind: "exact", id: p.id };
    if (inverted === 1) return { kind: "inverse", id: p.id };
    if (!best || same > best.same) best = { id: p.id, same, inverted };
  }
  if (best && best.inverted > 0.92) return { kind: "inverse", id: best.id };
  return { kind: "spurious", id: best?.id ?? null, overlap: best?.same ?? 0 };
}

export function energiesDecrease(energies) {
  for (let i = 1; i < energies.length; i++) {
    if (energies[i] > energies[i - 1] + 1e-6) return false;
  }
  return true;
}
