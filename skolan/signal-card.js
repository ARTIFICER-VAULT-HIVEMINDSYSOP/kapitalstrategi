const MONTHS = [
  "januari",
  "februari",
  "mars",
  "april",
  "maj",
  "juni",
  "juli",
  "augusti",
  "september",
  "oktober",
  "november",
  "december",
];

export function missing(value) {
  if (value == null) return "saknas";
  const text = String(value).trim();
  return text ? text : "saknas";
}

export function formatWhen(signal) {
  const date = signal?.publishedDate;
  const time = signal?.publishedTime;
  if (!date || date === "saknas" || !time || time === "saknas") return "saknas";
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const clock = /^(\d{2}):(\d{2})$/.exec(time);
  if (!day || !clock) return "saknas";
  const month = MONTHS[Number(day[2]) - 1];
  if (!month) return "saknas";
  return `${Number(day[3])} ${month} ${day[1]} kl. ${clock[1]}:${clock[2]}`;
}

export function outcomeSentence(signal) {
  const outcome = missing(signal?.outcome);
  const when = formatWhen(signal);
  return `Utfallet ${when} är ${outcome}, med risken att ett annat utfall är en förlust, och ett tidigare utfall säger ingenting om framtiden.`;
}

export function safeWhyHref(href) {
  if (typeof href === "string" && href.startsWith("/skolan/")) return href;
  return "/skolan/varfor/";
}

function field(dl, label, value) {
  const dt = document.createElement("dt");
  dt.textContent = label;
  const dd = document.createElement("dd");
  dd.textContent = missing(value);
  dl.append(dt, dd);
}

export function renderSignalCard(signal, options = {}) {
  const example = !!(options.example || signal?.example);
  const article = document.createElement("article");
  article.className = example ? "signal-card is-example" : "signal-card";
  if (example) {
    const badge = document.createElement("p");
    badge.className = "example-badge";
    badge.textContent = "EXEMPEL – inte en signal";
    article.append(badge);
  }

  const title = document.createElement("h2");
  title.textContent = example ? "Så ser ett signalkort ut" : missing(signal?.title);
  article.append(title);

  const same = document.createElement("p");
  same.className = "signal-same";
  same.textContent = "Samma kort för alla. Det är inte en bedömning av vad som passar dig.";
  article.append(same);

  const dl = document.createElement("dl");
  field(dl, "Vem som tagit fram", signal?.producer);
  field(dl, "Datum och klockslag", formatWhen(signal));
  field(dl, "Metod", signal?.method);
  field(dl, "Intressekonflikter", signal?.conflicts);
  article.append(dl);

  const why = document.createElement("p");
  const link = document.createElement("a");
  link.href = safeWhyHref(signal?.whyHref);
  link.textContent = signal?.whyLabel || "Varför, i kursen";
  why.append(link);
  article.append(why);

  const outcome = document.createElement("p");
  outcome.className = "outcome";
  outcome.textContent = outcomeSentence(signal);
  article.append(outcome);
  return article;
}
