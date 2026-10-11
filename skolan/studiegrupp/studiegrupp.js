import { COURSES } from "../coach/kursinnehall.js";

const INVITE_KEY = "ks.skolan.inbjudan";
const GAME_KEY = "ks.skolan.simspel";

function quizItems() {
  const wanted = ["bank-02-bank-of-england-1694", "mf-02-algoritmer-och-ai", "mf-06-sjalvforvar-kall-planbok"];
  const found = [];
  for (const id of wanted) {
    for (const course of COURSES) {
      const lesson = course.lessons.find((item) => item.id === id);
      if (lesson?.questions[0]) found.push({ lesson, question: lesson.questions[0] });
    }
  }
  return found;
}

function makeCode() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join("");
}

function readGame() {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Number.isInteger(parsed.correct) || !Number.isInteger(parsed.total)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function renderBoard() {
  const body = document.querySelector("#board-body");
  if (!body) return;
  body.replaceChildren();
  const game = readGame();
  const row = document.createElement("tr");
  const who = document.createElement("td");
  who.textContent = "Den här webbläsaren";
  const score = document.createElement("td");
  score.textContent = game ? `${game.correct} av ${game.total}` : "saknas";
  row.append(who, score);
  const other = document.createElement("tr");
  const otherWho = document.createElement("td");
  otherWho.textContent = "Andra deltagare";
  const otherScore = document.createElement("td");
  otherScore.textContent = "saknas";
  other.append(otherWho, otherScore);
  body.append(row, other);
}

function initInvite() {
  const button = document.querySelector("#invite-button");
  const output = document.querySelector("#invite-link");
  if (!button || !output) return;
  const show = (code) => {
    const url = `${location.origin}/skolan/extra/?inbjudan=${code}`;
    output.textContent = url;
  };
  try {
    const existing = localStorage.getItem(INVITE_KEY);
    if (existing) show(existing);
  } catch {
    output.textContent = "saknas";
  }
  button.addEventListener("click", () => {
    const code = makeCode();
    try {
      localStorage.setItem(INVITE_KEY, code);
      show(code);
    } catch {
      output.textContent = "saknas";
    }
  });
}

function initGame() {
  const form = document.querySelector("#sim-form");
  if (!form) return;
  const items = quizItems();
  items.forEach((item, index) => {
    const field = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = item.question.prompt;
    field.append(legend);
    item.question.options.forEach((option) => {
      const label = document.createElement("label");
      label.className = "check";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `sim-${index}`;
      input.value = option.correct ? "1" : "0";
      input.required = true;
      label.append(input, document.createTextNode(option.text));
      field.append(label);
    });
    form.append(field);
  });
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "btn";
  submit.textContent = "Räkna det simulerade spelet";
  form.append(submit);
  const result = document.createElement("p");
  result.className = "status";
  result.id = "sim-result";
  form.append(result);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    let correct = 0;
    for (let index = 0; index < items.length; index += 1) {
      if (data.get(`sim-${index}`) === "1") correct += 1;
    }
    const total = items.length;
    try {
      localStorage.setItem(GAME_KEY, JSON.stringify({ correct, total }));
      result.textContent = `Simulerat spel: ${correct} av ${total}.`;
    } catch {
      result.textContent = "saknas";
    }
    renderBoard();
  });
}

if (typeof document !== "undefined") {
  initInvite();
  initGame();
  renderBoard();
}
