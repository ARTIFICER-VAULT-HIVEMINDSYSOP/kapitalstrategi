import { renderSignalCard } from "../signal-card.js";

const EXAMPLE = {
  example: true,
  producer: "saknas",
  publishedDate: "saknas",
  publishedTime: "saknas",
  method: "saknas",
  conflicts: "saknas",
  whyHref: "/skolan/varfor/",
  whyLabel: "Varför, i kursen",
  outcome: "saknas",
};

async function loadSignals() {
  const response = await fetch("/skolan/data/signaler.json", { cache: "no-store" });
  if (!response.ok) throw new Error("saknas");
  const data = await response.json();
  return Array.isArray(data.signals) ? data.signals : [];
}

function showEmpty(list) {
  list.replaceChildren();
  const paragraph = document.createElement("p");
  paragraph.className = "empty";
  paragraph.textContent = "Inga signaler publicerade än";
  list.append(paragraph);
}

async function init() {
  const list = document.querySelector("#signal-list");
  const example = document.querySelector("#signal-example");
  if (example) example.append(renderSignalCard(EXAMPLE, { example: true }));
  if (!list) return;
  try {
    const signals = await loadSignals();
    if (!signals.length) {
      showEmpty(list);
      return;
    }
    list.replaceChildren();
    for (const signal of signals) list.append(renderSignalCard(signal));
  } catch {
    showEmpty(list);
    const note = document.createElement("p");
    note.className = "status";
    note.textContent = "saknas";
    list.append(note);
  }
}

if (typeof document !== "undefined") init();
