import { COURSES } from "./kursinnehall.js";
import { COACH_LLM_ENABLED, SYSTEM_PROMPT, askCoachLlm } from "./llm-adapter.js";
import {
  LIMITS,
  STORED,
  levelFromAwardCount,
  levelWhy,
  nextLevelText,
  readAwardCount,
} from "../niva.js";

export { COACH_LLM_ENABLED, SYSTEM_PROMPT };

export const FIXED_REFUSAL =
  "Det kan jag inte svara på. Jag förklarar kursens innehåll och ställer kontrollfrågor. Jag säger inte om du ska köpa eller sälja, och jag bedömer inte vad som passar dig. Gå tillbaka till lektionen i kursen, så tar vi nästa fråga där.";

export const PORTRAIT = "/brand/robban-portrait-transparent.png";

const STOP = new Set(
  "och att det som för med den har från till vad hur när var kan man inte om ett på av är jag du vi de den detta denna här där också bara mer utan eller men ni er min mitt dina ska ska jag om".split(
    " ",
  ),
);

export function allLessons() {
  const list = [];
  for (const course of COURSES) {
    for (const lesson of course.lessons) list.push({ course, lesson });
  }
  return list;
}

export function findById(id) {
  return allLessons().find((item) => item.lesson.id === id) || null;
}

function tokens(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP.has(word));
}

function isAdvice(text) {
  const value = text.toLowerCase();
  if (/\b(köp|köpa|köper|sälj|sälja|säljer)\b/.test(value)) return true;
  if (/passar\s+(det\s+)?(mig|min|just)/.test(value)) return true;
  if (/rekommend/.test(value)) return true;
  if (/för\s+min\s+del/.test(value)) return true;
  if (/min\s+(ekonomi|situation|portfölj)/.test(value)) return true;
  if (/\b(borde|skulle)\s+jag\b/.test(value) && !/läsa|lära|repetera|öva/.test(value)) return true;
  if (/\bska\s+jag\b/.test(value) && !/läsa|lära|repetera|öva|börja|fortsätta/.test(value)) return true;
  return false;
}

function learningLines(lesson) {
  return lesson.bullets.filter((line) => !/https?:/i.test(line)).slice(0, 3);
}

function nextItem(current) {
  const list = allLessons();
  const index = list.findIndex((item) => item.lesson.id === current.lesson.id);
  if (index < 0 || index === list.length - 1) return list[0];
  return list[index + 1];
}

function otherCourse(item) {
  return item.course.id === COURSES[0].id ? COURSES[1] : COURSES[0];
}

function questionAt(item, index) {
  const questions = item.lesson.questions;
  if (!questions.length) return null;
  return questions[index % questions.length];
}

function choiceList(question) {
  return question.options.map((option) => ({ label: option.text, value: option.text }));
}

function contextOf(state, context) {
  const awards = Number.isInteger(context?.awards)
    ? context.awards
    : Number.isInteger(state?.awards)
      ? state.awards
      : 0;
  return { awards, level: levelFromAwardCount(awards) };
}

function pack(lines, item, view, question, choices, extraState = {}) {
  return {
    text: lines.filter(Boolean).join(" "),
    choices: choices || (question ? choiceList(question) : []),
    state: {
      lessonId: item?.lesson.id || null,
      questionIndex: extraState.questionIndex || 0,
      awaiting: question ? "question" : null,
      awards: view.awards,
      level: view.level,
      step: extraState.step || (question ? 1 : 0),
    },
    source: "local",
    level: view.level,
    transparency: transparencyFor(item, view),
  };
}

function transparencyFor(item, view) {
  return {
    level: view.level,
    awards: view.awards,
    levelWhy: levelWhy(view.level, view.awards),
    next: nextLevelText(view.level),
    lessonId: item?.lesson.id || null,
    lessonTitle: item?.lesson.title || "saknas",
    courseTitle: item?.course.title || "saknas",
    href: item ? `/skolan/coach/?lektion=${encodeURIComponent(item.lesson.id)}` : "/skolan/coach/",
    mode: "kurskort",
    llm: false,
    limits: LIMITS,
    stored: STORED,
  };
}

function bridge(item) {
  const other = otherCourse(item);
  return `Koppling mellan kurserna: ${other.title} börjar i ${other.lessons[0].title}. ${other.summary}`;
}

function twoStep(item, question) {
  const other = otherCourse(item);
  const second = other.lessons[0].questions[0];
  return `Fråga i två steg. Steg 1: ${question.prompt} Steg 2: ${second ? second.prompt : "saknas"}`;
}

function signalBlock() {
  return "Signalkortet läses så här, samma kort för alla: vem som tagit fram det, datum och klockslag, metod och intressekonflikter. I den publicerade listan är de fälten saknas. Övningen stannar på simulerat underlag. Ett utfall som saknas säger ingenting om framtiden, med risken att ett annat utfall är en förlust.";
}

function comparisonBlock() {
  const first = COURSES[0].lessons[0];
  const second = COURSES[1].lessons[0];
  return `Jämförelse: ${first.title}. ${first.summary} Ställ det mot ${second.title}. ${second.summary}`;
}

function socratic(item) {
  return `Följdfråga: vad i ${item.lesson.title} handlar om förtroende eller om en gemensam bok, innan jag lägger till nästa stycke?`;
}

function explainLesson(item, questionIndex, view) {
  const question = questionAt(item, questionIndex);
  const goals = learningLines(item.lesson).slice(0, view.level === 1 ? 1 : 3);
  const next = nextItem(item);
  const lines = [
    `${item.lesson.title} ingår i ${item.course.title}.`,
    item.lesson.summary,
    goals.length ? `Efter lektionen kan du ${goals.join(" ")}` : "",
    `Nästa lektion är ${next.lesson.title}.`,
  ];
  if (view.level >= 2) {
    lines.push(bridge(item));
  }
  if (view.level >= 3) {
    lines.push(comparisonBlock());
    lines.push(signalBlock());
    lines.push(socratic(item));
  }
  if (question) {
    lines.push(view.level === 1 ? `Kontrollfråga: ${question.prompt}` : twoStep(item, question));
  }
  return pack(lines, item, view, question);
}

function lockedTopic(view, item) {
  return pack(
    [
      `På nivå ${view.level} tar jag en lektion i taget.`,
      nextLevelText(view.level),
    ],
    item,
    view,
    null,
    [],
  );
}

function conceptReply(kind, view) {
  if (kind === "havstang") {
    const item = findById("bank-05-delreservsystemet");
    const lines = [
      "Hävstång som kursbegrepp: den förstorar utfallet åt båda håll, med risken att förlusten blir större, och den ersätter inte en stop-loss.",
      "Siffror för hävstång saknas i Bankernas historia och Marknadens framtid.",
    ];
    if (view.level >= 2) lines.push(bridge(item));
    if (view.level >= 3) {
      lines.push(signalBlock());
      lines.push(socratic(item));
    }
    return pack(lines, item, view, null, []);
  }
  if (kind === "stoploss") {
    const item = findById("bank-05-delreservsystemet");
    const lines = [
      "Stop-loss som kursbegrepp: en planerad utgång om priset går emot dig, så att en förlust är bestämd i förväg.",
      "Siffror saknas i de här två kurserna.",
    ];
    if (view.level >= 2) lines.push(bridge(item));
    if (view.level >= 3) lines.push(socratic(item));
    return pack(lines, item, view, null, []);
  }
  return null;
}

function conceptOf(text) {
  const value = text.toLowerCase();
  const rows = [
    { re: /delreserv/, lessonId: "bank-05-delreservsystemet", min: 1 },
    { re: /inflation/, lessonId: "bank-01-riksbanken-1668", min: 2 },
    { re: /likviditet/, lessonId: "bank-05-delreservsystemet", min: 2 },
    { re: /hävstång|havstang/, min: 2, kind: "havstang" },
    { re: /stop-?loss|stop loss/, min: 2, kind: "stoploss" },
    { re: /signalkort/, lessonId: "bank-08-sa-hanger-det-ihop", min: 3, kind: "signal" },
    { re: /jämför|jamfor|historiska exempel/, lessonId: "bank-01-riksbanken-1668", min: 3, kind: "compare" },
  ];
  return rows.find((row) => row.re.test(value)) || null;
}

function norm(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeAnswer(question, text) {
  const value = norm(text);
  if (!value || value.length < 2) return false;
  return question.options.some((option) => {
    const optionText = norm(option.text);
    return value === optionText || (optionText.length > 8 && (optionText.includes(value) || value.includes(optionText)));
  });
}

function grade(item, state, text, view) {
  const question = questionAt(item, state.questionIndex || 0);
  const picked = question.options.find((option) => {
    const optionText = norm(option.text);
    const value = norm(text);
    return value === optionText || (optionText.length > 8 && (optionText.includes(value) || value.includes(optionText)));
  });
  const correct = question.options.find((option) => option.correct);
  const lines = [
    picked?.correct
      ? `Ja. ${question.explanation}`
      : `Inte den här gången. I kursen är svaret: ${correct?.text || "saknas"}. ${question.explanation}`,
  ];
  if (view.level >= 2 && (state.step || 1) === 1) {
    const other = otherCourse(item).lessons[0];
    const follow = other.questions[0];
    if (follow) {
      lines.push(`Steg 2: ${follow.prompt}`);
      if (view.level >= 3) lines.push(socratic(item));
      return pack(lines, { course: otherCourse(item), lesson: other }, view, follow, choiceList(follow), {
        questionIndex: 0,
        step: 2,
      });
    }
  }
  const next = nextItem(item);
  lines.push(`Nästa lektion är ${next.lesson.title}.`);
  if (view.level >= 3) lines.push(socratic(item));
  return pack(lines, item, view, null, [{ label: next.lesson.title, value: next.lesson.id }]);
}

function courseOverview(course, view) {
  const item = { course, lesson: course.lessons[0] };
  const lines = [`${course.title}. ${course.summary}`];
  if (view.level === 1) {
    lines.push(`Jag börjar med ${item.lesson.title} om du vill.`);
  } else {
    lines.push(bridge(item));
  }
  if (view.level >= 3) {
    lines.push(comparisonBlock());
    lines.push(signalBlock());
  }
  return pack(
    lines,
    item,
    view,
    null,
    course.lessons.slice(0, view.level === 1 ? 2 : 4).map((lesson) => ({ label: lesson.title, value: lesson.id })),
  );
}

function findLesson(text) {
  const query = tokens(text);
  if (!query.length) return null;
  let best = null;
  let bestScore = 0;
  for (const item of allLessons()) {
    const title = item.lesson.title.toLowerCase();
    const blob = `${title} ${item.lesson.summary} ${learningLines(item.lesson).join(" ")}`.toLowerCase();
    let score = 0;
    for (const word of query) {
      if (blob.includes(word)) score += word.length > 6 ? 2 : 1;
      if (title.includes(word)) score += 3;
    }
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return bestScore >= 2 ? best : null;
}

export function answerCoach(text, state = {}, context = {}) {
  const trimmed = String(text || "").trim();
  const view = contextOf(state, context);
  if (!trimmed) {
    return pack(["Skriv en fråga om en lektion, så tar vi den."], null, view, null, []);
  }
  if (isAdvice(trimmed)) {
    const refusal = pack([FIXED_REFUSAL], null, view, null, []);
    refusal.text = FIXED_REFUSAL;
    refusal.source = "guardrail";
    refusal.state = { ...state, awaiting: null, awards: view.awards, level: view.level };
    return refusal;
  }

  const direct = findById(trimmed) || findById(trimmed.replace(/^lektion\s+/i, ""));
  if (direct) return explainLesson(direct, 0, view);

  if (state.awaiting === "question" && state.lessonId) {
    const current = findById(state.lessonId);
    const question = current && questionAt(current, state.questionIndex || 0);
    if (question && looksLikeAnswer(question, trimmed)) return grade(current, state, trimmed, view);
  }

  const concept = conceptOf(trimmed);
  if (concept) {
    if (view.level < concept.min) return lockedTopic(view, concept.lessonId ? findById(concept.lessonId) : null);
    if (concept.kind === "havstang" || concept.kind === "stoploss") return conceptReply(concept.kind, view);
    if (concept.kind === "compare" && view.level >= 3) {
      const item = findById(concept.lessonId);
      return pack([comparisonBlock(), socratic(item), signalBlock()], item, view, null, []);
    }
    if (concept.kind === "signal" && view.level >= 3) {
      const item = findById(concept.lessonId);
      return pack(
        [`${item.lesson.title} ingår i ${item.course.title}.`, item.lesson.summary, signalBlock(), socratic(item)],
        item,
        view,
        null,
        [],
      );
    }
    if (concept.lessonId) return explainLesson(findById(concept.lessonId), 0, view);
  }

  const lower = trimmed.toLowerCase();
  if (/bankernas historia/.test(lower) && tokens(lower).length < 6) return courseOverview(COURSES[0], view);
  if (/marknadens framtid/.test(lower) && tokens(lower).length < 6) return courseOverview(COURSES[1], view);

  if (/nästa lektion/.test(lower) && state.lessonId) {
    const current = findById(state.lessonId);
    if (current) return explainLesson(nextItem(current), 0, view);
  }

  if (/kontrollfråga/.test(lower)) {
    const current = (state.lessonId && findById(state.lessonId)) || allLessons()[0];
    return explainLesson(current, state.lessonId ? state.questionIndex || 0 : 0, view);
  }

  const found = findLesson(trimmed);
  if (found) return explainLesson(found, 0, view);

  return pack(
    [
      "Jag kan förklara lektionerna i Bankernas historia och Marknadens framtid. Välj en lektion, så tar jag den, ställer en kontrollfråga och pekar på nästa.",
    ],
    null,
    view,
    null,
    [
      { label: "Bankernas historia", value: "Bankernas historia" },
      { label: "Marknadens framtid", value: "Marknadens framtid" },
    ],
  );
}

export async function answerCoachWithAdapter(text, state = {}, context = {}) {
  const view = contextOf(state, context);
  if (isAdvice(String(text || ""))) return answerCoach(text, state, view);
  if (COACH_LLM_ENABLED) {
    const llm = await askCoachLlm({ system: SYSTEM_PROMPT, text, state });
    if (llm.ok && llm.text) {
      return {
        text: llm.text,
        choices: [],
        state,
        source: "llm",
        level: view.level,
        transparency: transparencyFor(null, view),
      };
    }
  }
  return answerCoach(text, state, view);
}

function panel(result) {
  const info = result.transparency;
  const details = document.createElement("details");
  details.className = "why-panel";
  const summary = document.createElement("summary");
  summary.textContent = "Varför svarar Robban så här?";
  details.append(summary);
  const from = document.createElement("p");
  if (info.lessonId) {
    from.append("Svaret kommer från kurskortet ");
    const link = document.createElement("a");
    link.href = info.href;
    link.textContent = info.lessonTitle;
    from.append(link, ` i ${info.courseTitle}.`);
  } else {
    from.textContent = "Kurskort: saknas. Svaret är den fasta spärren, samma på varje nivå.";
  }
  const level = document.createElement("p");
  level.textContent = info.levelWhy;
  const mode = document.createElement("p");
  mode.textContent =
    "Robban kör från kurskorten. Det är regelkort, inte en fri språkmodell. COACH_LLM_ENABLED är av.";
  const limits = document.createElement("p");
  limits.textContent = info.limits;
  const stored = document.createElement("p");
  stored.textContent = info.stored;
  const next = document.createElement("p");
  next.textContent = info.next;
  details.append(from, level, mode, limits, stored, next);
  return details;
}

function appendMessage(log, role, result, level) {
  const item = document.createElement("li");
  item.className = role === "user" ? "msg msg-user" : "msg msg-robban";
  if (role !== "user") {
    const photo = document.createElement("img");
    photo.src = PORTRAIT;
    photo.alt = "";
    photo.width = 48;
    photo.height = 48;
    photo.className = `robban-avatar is-level-${level}`;
    item.append(photo);
  }
  const body = document.createElement("div");
  if (role !== "user") {
    const name = document.createElement("p");
    name.className = "msg-name";
    name.textContent = "Robban Robotsson";
    body.append(name);
  }
  const paragraph = document.createElement("p");
  paragraph.textContent = result.text;
  body.append(paragraph);
  if (result.choices?.length) {
    const choices = document.createElement("div");
    choices.className = "choice-row";
    for (const choice of result.choices) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = choice.label;
      button.addEventListener("click", () => submit(choice.value));
      choices.append(button);
    }
    body.append(choices);
  }
  if (role !== "user" && result.transparency) body.append(panel(result));
  item.append(body);
  log.append(item);
  log.scrollTop = log.scrollHeight;
}

function paintLevel(level, awards) {
  const frame = document.querySelector("#hero-robban");
  if (frame) frame.dataset.level = String(level);
  const badge = document.querySelector("#level-badge");
  if (badge) badge.textContent = `Nivå ${level}`;
  const next = document.querySelector("#level-next");
  if (next) next.textContent = nextLevelText(level);
  const count = document.querySelector("#award-count");
  if (count) count.textContent = `Utmärkelser i den här webbläsaren: ${awards}.`;
  const greet = document.querySelector("#greet-level");
  if (greet) greet.textContent = levelWhy(level, awards);
  document.querySelectorAll("[data-min-level]").forEach((button) => {
    const min = Number(button.getAttribute("data-min-level"));
    button.hidden = level < min;
  });
  document.querySelectorAll(".robban-avatar").forEach((img) => {
    img.className = `robban-avatar is-level-${level}`;
  });
}

let submit = () => {};

function initCoach() {
  const form = document.querySelector("#coach-form");
  const input = document.querySelector("#coach-input");
  const log = document.querySelector("#chat-log");
  if (!form || !input || !log) return;
  let state = {};
  let awards = readAwardCount(localStorage);
  paintLevel(levelFromAwardCount(awards), awards);

  submit = async (text) => {
    const value = String(text || "").trim();
    if (!value) return;
    awards = readAwardCount(localStorage);
    const level = levelFromAwardCount(awards);
    paintLevel(level, awards);
    appendMessage(log, "user", { text: value }, level);
    const result = await answerCoachWithAdapter(value, state, { awards });
    state = result.state || state;
    appendMessage(log, "robban", result, result.level || level);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value;
    input.value = "";
    submit(value);
  });

  document.querySelectorAll("[data-ask]").forEach((button) => {
    button.addEventListener("click", () => submit(button.getAttribute("data-ask")));
  });

  const params = new URLSearchParams(location.search);
  const lessonId = params.get("lektion");
  if (lessonId && findById(lessonId)) {
    answerCoachWithAdapter(lessonId, state, { awards }).then((result) => {
      state = result.state || state;
      appendMessage(log, "robban", result, result.level || levelFromAwardCount(awards));
    });
  }
}

if (typeof document !== "undefined") initCoach();
