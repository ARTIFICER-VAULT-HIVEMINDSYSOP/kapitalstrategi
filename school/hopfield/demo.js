import {
  BASE_PATTERNS,
  N,
  applyNoise,
  capacity,
  classify,
  energy,
  hebbWeights,
  mulberry32,
  noiseSeed,
  randomPattern,
  stepOnce,
} from "./engine.js";

const COPY = {
  sv: {
    title: "Hopfield-demo",
    lead: "10×10 neuroner. Välj ett lagrat mönster, lägg på brus och återkalla hela minnet.",
    patterns: "Lagrade mönster",
    up: "Pil upp",
    down: "Pil ner",
    line: "Linje",
    h: "Bokstaven H",
    noise: "Brus",
    recall: "Återkalla",
    storeMore: "Lagra fler mönster",
    reset: "Återställ fyra mönster",
    energy: "Energi",
    step: "Steg",
    stored: "Lagrade",
    cap: "Kapacitet ca",
    running: "Rullar ner mot närmaste dal…",
    exact: "Hela mönstret hämtades från ledtråden.",
    other: "Ett annat lagrat mönster vann över ledtråden.",
    inverse: "Inverterat mönster — ett falskt minne.",
    spurious: "Falskt minne: tillståndet är varken ett lagrat mönster eller dess invers.",
    overfull: "För många mönster är lagrade. Minnen kan blandas. Tryck Återkalla och se om dalen fortfarande är det mönster du bad om.",
    idle: "Välj ett mönster, ställ brusreglaget och tryck Återkalla.",
    cell: "Neuron",
  },
  en: {
    title: "Hopfield demo",
    lead: "10×10 neurons. Pick a stored pattern, add noise and recall the whole memory.",
    patterns: "Stored patterns",
    up: "Arrow up",
    down: "Arrow down",
    line: "Line",
    h: "Letter H",
    noise: "Noise",
    recall: "Recall",
    storeMore: "Store more patterns",
    reset: "Restore four patterns",
    energy: "Energy",
    step: "Step",
    stored: "Stored",
    cap: "Capacity about",
    running: "Rolling down toward the nearest valley…",
    exact: "The whole pattern was retrieved from the cue.",
    other: "A different stored pattern won over the cue.",
    inverse: "Inverted pattern — a false memory.",
    spurious: "False memory: the state is neither a stored pattern nor its inverse.",
    overfull: "Too many patterns are stored. Memories can mix. Press Recall and see whether the valley is still the pattern you asked for.",
    idle: "Pick a pattern, set the noise slider and press Recall.",
    cell: "Neuron",
  },
  uk: {
    title: "Демонстрація Гопфілда",
    lead: "10×10 нейронів. Оберіть збережений образ, додайте шум і відтворіть усю пам'ять.",
    patterns: "Збережені образи",
    up: "Стрілка вгору",
    down: "Стрілка вниз",
    line: "Лінія",
    h: "Літера H",
    noise: "Шум",
    recall: "Відтворити",
    storeMore: "Зберегти більше образів",
    reset: "Повернути чотири образи",
    energy: "Енергія",
    step: "Крок",
    stored: "Збережено",
    cap: "Ємність бл.",
    running: "Скочується в найближчу долину…",
    exact: "Увесь образ відновлено з підказки.",
    other: "Переміг інший збережений образ.",
    inverse: "Інвертований образ — хибна пам'ять.",
    spurious: "Хибна пам'ять: стан не є ні збереженим образом, ні його інверсією.",
    overfull: "Збережено забагато образів. Спогади можуть змішатися. Натисніть «Відтворити» і подивіться, чи долина досі є тим образом, який ви просили.",
    idle: "Оберіть образ, поставте шум і натисніть «Відтворити».",
    cell: "Нейрон",
  },
};

const params = new URLSearchParams(location.search);
const lang = params.get("lang") === "en" || params.get("lang") === "uk" ? params.get("lang") : "sv";
document.documentElement.lang = lang === "uk" ? "uk" : lang;
document.body.dataset.theme = params.get("theme") === "light" ? "light" : "dark";

const t = COPY[lang];
const root = document.getElementById("hopfield-root");
const baseStates = BASE_PATTERNS.map((p) => p.state);

const model = {
  selected: "up",
  noise: 0,
  cue: BASE_PATTERNS[0].state.slice(),
  stored: baseStates.map((s) => s.slice()),
  weights: hebbWeights(baseStates),
  overfull: false,
  running: false,
  timer: 0,
  cursor: 0,
  steps: 0,
  energy: 0,
  stable: false,
  match: "",
  message: t.idle,
};

function selectedPattern() {
  return BASE_PATTERNS.find((p) => p.id === model.selected) ?? BASE_PATTERNS[0];
}

function rebuildWeights() {
  model.weights = hebbWeights(model.stored);
}

function loadCue() {
  const clean = selectedPattern().state;
  const rate = model.noise / 100;
  model.cue = rate === 0 ? clean.slice() : applyNoise(clean, rate, mulberry32(noiseSeed(model.selected, model.noise)));
  model.steps = 0;
  model.cursor = 0;
  model.stable = false;
  model.match = "";
  model.energy = energy(model.weights, model.cue);
  model.message = model.overfull ? t.overfull : t.idle;
}

function stop() {
  model.running = false;
  if (model.timer) cancelAnimationFrame(model.timer);
  model.timer = 0;
}

function matchKind() {
  const found = classify(model.cue, BASE_PATTERNS);
  if (found.kind === "exact") return found.id === model.selected ? "exact" : "other";
  return found.kind;
}

function finishStatus() {
  model.match = matchKind();
  model.message = t[model.match] || t.spurious;
  model.stable = true;
}

function tick() {
  if (!model.running) return;
  const step = stepOnce(model.weights, model.cue, model.cursor);
  if (step.stable) {
    model.running = false;
    model.energy = energy(model.weights, model.cue);
    finishStatus();
    paint();
    return;
  }
  model.cue = step.state;
  model.cursor = step.nextIndex;
  model.steps += 1;
  model.energy = energy(model.weights, model.cue);
  paint();
  model.timer = requestAnimationFrame(tick);
}

function recallNow() {
  stop();
  model.running = true;
  model.stable = false;
  model.match = "";
  model.steps = 0;
  model.cursor = 0;
  model.message = t.running;
  model.energy = energy(model.weights, model.cue);
  paint();
  model.timer = requestAnimationFrame(tick);
}

function storeMore() {
  stop();
  const rng = mulberry32(20240928);
  const extra = [];
  for (let i = 0; i < 20; i++) extra.push(randomPattern(rng));
  model.stored = baseStates.map((s) => s.slice()).concat(extra);
  model.overfull = true;
  rebuildWeights();
  loadCue();
  paint();
}

function restoreFour() {
  stop();
  model.stored = baseStates.map((s) => s.slice());
  model.overfull = false;
  rebuildWeights();
  loadCue();
  paint();
}

let painting = false;
let paintValue = 1;

function setCell(index, value) {
  if (model.cue[index] === value) return;
  model.cue[index] = value;
  model.stable = false;
  model.match = "";
  model.energy = energy(model.weights, model.cue);
  model.message = model.overfull ? t.overfull : t.idle;
}

root.innerHTML = `
  <div class="hf" id="hopfield-demo">
    <h2></h2>
    <p class="hf-lead"></p>
    <div class="hf-meta">
      <span data-field="energy"></span>
      <span data-field="step"></span>
      <span data-field="stored"></span>
    </div>
    <div class="hf-layout">
      <div class="hf-grid" role="grid"></div>
      <div class="hf-controls">
        <div>
          <div class="hf-patterns" role="group"></div>
        </div>
        <label class="hf-noise">
          <span data-field="noise-label"></span>
          <input id="hopfield-noise" type="range" min="0" max="50" step="1" value="0" />
        </label>
        <div class="hf-actions">
          <button type="button" id="hopfield-recall" class="is-primary"></button>
          <button type="button" id="hopfield-store"></button>
          <button type="button" id="hopfield-reset" hidden></button>
        </div>
      </div>
    </div>
    <p class="hf-status" id="hopfield-status" role="status"></p>
  </div>
`;

const grid = root.querySelector(".hf-grid");
const cells = [];
for (let i = 0; i < N; i++) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "hf-cell";
  btn.dataset.index = String(i);
  btn.setAttribute("role", "gridcell");
  btn.addEventListener("pointerdown", (ev) => {
    if (ev.button != null && ev.button !== 0) return;
    ev.preventDefault();
    stop();
    painting = true;
    paintValue = model.cue[i] === 1 ? -1 : 1;
    setCell(i, paintValue);
    paint();
  });
  grid.appendChild(btn);
  cells.push(btn);
}
grid.addEventListener("pointermove", (ev) => {
  if (!painting) return;
  const el = document.elementFromPoint(ev.clientX, ev.clientY);
  const index = el && el.dataset ? Number(el.dataset.index) : NaN;
  if (!Number.isInteger(index)) return;
  setCell(index, paintValue);
  paint();
});
window.addEventListener("pointerup", () => {
  painting = false;
});
window.addEventListener("pointercancel", () => {
  painting = false;
});

const patternRow = root.querySelector(".hf-patterns");
for (const p of BASE_PATTERNS) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.pattern = p.id;
  btn.addEventListener("click", () => {
    stop();
    model.selected = p.id;
    loadCue();
    paint();
  });
  patternRow.appendChild(btn);
}

root.querySelector("#hopfield-noise").addEventListener("input", (ev) => {
  stop();
  model.noise = Number(ev.target.value);
  loadCue();
  paint();
});
root.querySelector("#hopfield-recall").addEventListener("click", recallNow);
root.querySelector("#hopfield-store").addEventListener("click", storeMore);
root.querySelector("#hopfield-reset").addEventListener("click", restoreFour);

window.addEventListener("message", (ev) => {
  if (ev.origin !== location.origin) return;
  if (!ev.data || ev.data.type !== "hopfield-theme") return;
  document.body.dataset.theme = ev.data.theme === "light" ? "light" : "dark";
});

function paint() {
  root.querySelector("h2").textContent = t.title;
  root.querySelector(".hf-lead").textContent = t.lead;
  const cap = Math.round(capacity());
  root.querySelector('[data-field="energy"]').textContent = `${t.energy}: ${Math.round(model.energy)}`;
  root.querySelector('[data-field="step"]').textContent = `${t.step}: ${model.steps}`;
  root.querySelector('[data-field="stored"]').textContent = `${t.stored}: ${model.stored.length} · ${t.cap} ${cap}`;
  root.querySelector('[data-field="noise-label"]').textContent = `${t.noise}: ${model.noise} %`;
  root.querySelector("#hopfield-recall").textContent = t.recall;
  root.querySelector("#hopfield-store").textContent = t.storeMore;
  const resetBtn = root.querySelector("#hopfield-reset");
  resetBtn.hidden = !model.overfull;
  resetBtn.textContent = t.reset;
  patternRow.setAttribute("aria-label", t.patterns);
  for (const btn of patternRow.querySelectorAll("button")) {
    btn.textContent = t[btn.dataset.pattern];
    btn.setAttribute("aria-pressed", btn.dataset.pattern === model.selected ? "true" : "false");
  }
  cells.forEach((btn, i) => {
    const on = model.cue[i] === 1;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", `${t.cell} ${i + 1}`);
  });
  const status = root.querySelector("#hopfield-status");
  status.textContent = model.message;
  status.classList.toggle("is-exact", model.match === "exact");
  status.classList.toggle("is-bad", model.match === "inverse" || model.match === "spurious" || model.match === "other");
  const demo = root.querySelector("#hopfield-demo");
  demo.dataset.energy = String(Math.round(model.energy));
  demo.dataset.steps = String(model.steps);
  demo.dataset.stable = model.stable ? "true" : "false";
  demo.dataset.match = model.match;
  demo.dataset.stored = String(model.stored.length);
  demo.dataset.noise = String(model.noise);
  demo.dataset.running = model.running ? "true" : "false";
  const height = Math.ceil(document.documentElement.scrollHeight);
  parent.postMessage({ type: "hopfield-height", height }, location.origin);
}

loadCue();
paint();
window.addEventListener("resize", () => {
  parent.postMessage({ type: "hopfield-height", height: Math.ceil(document.documentElement.scrollHeight) }, location.origin);
});
