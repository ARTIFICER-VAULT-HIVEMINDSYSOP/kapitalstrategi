import { outcomeSentence, renderSignalCard } from "../signal-card.js";

function emptyState(root) {
  root.replaceChildren();
  const paragraph = document.createElement("p");
  paragraph.className = "empty";
  paragraph.textContent =
    "Utfall: saknas, med risken att ett annat utfall är en förlust, och ett tidigare utfall säger ingenting om framtiden.";
  root.append(paragraph);
}

async function init() {
  const root = document.querySelector("#historik-list");
  if (!root) return;
  try {
    const response = await fetch("/skolan/data/signaler.json", { cache: "no-store" });
    if (!response.ok) throw new Error("saknas");
    const data = await response.json();
    const signals = Array.isArray(data.signals) ? data.signals : [];
    if (!signals.length) {
      emptyState(root);
      return;
    }
    root.replaceChildren();
    for (const signal of signals) {
      const card = renderSignalCard(signal);
      const outcome = card.querySelector(".outcome");
      if (outcome) outcome.textContent = outcomeSentence(signal);
      root.append(card);
    }
  } catch {
    emptyState(root);
  }
}

if (typeof document !== "undefined") init();
