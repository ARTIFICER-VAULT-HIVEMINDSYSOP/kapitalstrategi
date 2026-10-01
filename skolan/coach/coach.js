import { COURSES } from "./kursinnehall.js";
import { COACH_LLM_ENABLED, SYSTEM_PROMPT, askCoachLlm } from "./llm-adapter.js";

export { COACH_LLM_ENABLED, SYSTEM_PROMPT };

export const FIXED_REFUSAL =
  "Det kan jag inte svara på. Jag förklarar kursens innehåll och ställer kontrollfrågor. Jag säger inte om du ska köpa eller sälja, och jag bedömer inte vad som passar dig. Gå tillbaka till lektionen i kursen, så tar vi nästa fråga där.";

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

function questionAt(item, index) {
  const questions = item.lesson.questions;
  if (!questions.length) return null;
  return questions[index % questions.length];
}

function choiceList(question) {
  return question.options.map((option) => ({ label: option.text, value: option.text }));
}

function explainLesson(item, questionIndex = 0) {
  const question = questionAt(item, questionIndex);
  const lines = [
    `${item.lesson.title} ingår i ${item.course.title}.`,
    item.lesson.summary,
  ];
  const goals = learningLines(item.lesson);
  if (goals.length) {
    lines.push(`Efter lektionen kan du ${goals.join(" ")}`);
  }
  const next = nextItem(item);
  lines.push(`Nästa lektion är ${next.lesson.title}.`);
  if (question) {
    lines.push(`Kontrollfråga: ${question.prompt}`);
  }
  return {
    text: lines.join(" "),
    choices: question ? choiceList(question) : [],
    state: {
      lessonId: item.lesson.id,
      questionIndex,
      awaiting: question ? "question" : null,
    },
    source: "local",
  };
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
  if (!value) return false;
  return question.options.some((option) => {
    const optionText = norm(option.text);
    return value === optionText || optionText.includes(value) || value.includes(optionText);
  });
}

function grade(item, state, text) {
  const question = questionAt(item, state.questionIndex || 0);
  const picked = question.options.find((option) => {
    const optionText = norm(option.text);
    const value = norm(text);
    return value === optionText || optionText.includes(value) || value.includes(optionText);
  });
  const correct = question.options.find((option) => option.correct);
  const ok = !!picked?.correct;
  const next = nextItem(item);
  const nextIndex = (state.questionIndex || 0) + 1;
  const follow = questionAt(item, nextIndex);
  const lines = [
    ok
      ? `Ja. ${question.explanation}`
      : `Inte den här gången. I kursen är svaret: ${correct?.text || "saknas"}. ${question.explanation}`,
  ];
  if (follow && nextIndex < item.lesson.questions.length) {
    lines.push(`Nästa kontrollfråga i samma lektion: ${follow.prompt}`);
    lines.push(`När du vill gå vidare är nästa lektion ${next.lesson.title}.`);
    return {
      text: lines.join(" "),
      choices: choiceList(follow),
      state: { lessonId: item.lesson.id, questionIndex: nextIndex, awaiting: "question" },
      source: "local",
    };
  }
  lines.push(`Nästa lektion är ${next.lesson.title}. Säg till om jag ska öppna den.`);
  return {
    text: lines.join(" "),
    choices: [{ label: next.lesson.title, value: next.lesson.id }],
    state: { lessonId: item.lesson.id, questionIndex: nextIndex, awaiting: null },
    source: "local",
  };
}

function courseOverview(course) {
  const titles = course.lessons.map((lesson) => lesson.title).join(" ");
  const first = { course, lesson: course.lessons[0] };
  return {
    text: `${course.title}. ${course.summary} Lektionerna är: ${titles}. Jag börjar med ${first.lesson.title} om du vill.`,
    choices: course.lessons.slice(0, 4).map((lesson) => ({ label: lesson.title, value: lesson.id })),
    state: { lessonId: null, questionIndex: 0, awaiting: null },
    source: "local",
  };
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

export function answerCoach(text, state = {}) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    return {
      text: "Skriv en fråga om en lektion, så tar vi den.",
      choices: [],
      state,
      source: "local",
    };
  }
  if (isAdvice(trimmed)) {
    return { text: FIXED_REFUSAL, choices: [], state: { ...state, awaiting: null }, source: "guardrail" };
  }

  const direct = findById(trimmed) || findById(trimmed.replace(/^lektion\s+/i, ""));
  if (direct) return explainLesson(direct, 0);

  if (state.awaiting === "question" && state.lessonId) {
    const current = findById(state.lessonId);
    const question = current && questionAt(current, state.questionIndex || 0);
    if (question && looksLikeAnswer(question, trimmed)) return grade(current, state, trimmed);
  }

  const lower = trimmed.toLowerCase();
  if (/bankernas historia/.test(lower) && tokens(lower).length < 6) return courseOverview(COURSES[0]);
  if (/marknadens framtid/.test(lower) && tokens(lower).length < 6) return courseOverview(COURSES[1]);

  if (/nästa lektion/.test(lower) && state.lessonId) {
    const current = findById(state.lessonId);
    if (current) return explainLesson(nextItem(current), 0);
  }

  if (/kontrollfråga/.test(lower)) {
    const current = (state.lessonId && findById(state.lessonId)) || allLessons()[0];
    const index = state.lessonId ? state.questionIndex || 0 : 0;
    const built = explainLesson(current, index);
    return built;
  }

  const found = findLesson(trimmed);
  if (found) return explainLesson(found, 0);

  return {
    text: "Jag kan förklara lektionerna i Bankernas historia och Marknadens framtid. Välj en lektion, så tar jag den, ställer en kontrollfråga och pekar på nästa.",
    choices: [
      { label: "Bankernas historia", value: "Bankernas historia" },
      { label: "Marknadens framtid", value: "Marknadens framtid" },
    ],
    state,
    source: "local",
  };
}

export async function answerCoachWithAdapter(text, state = {}) {
  if (isAdvice(String(text || ""))) return answerCoach(text, state);
  if (COACH_LLM_ENABLED) {
    const llm = await askCoachLlm({ system: SYSTEM_PROMPT, text, state });
    if (llm.ok && llm.text) {
      return { text: llm.text, choices: [], state, source: "llm" };
    }
  }
  return answerCoach(text, state);
}

function appendMessage(log, role, result) {
  const item = document.createElement("li");
  item.className = role === "user" ? "msg msg-user" : "msg msg-robban";
  if (role !== "user") {
    const photo = document.createElement("img");
    photo.src = "/brand/robban-portrait.png";
    photo.alt = "";
    photo.width = 36;
    photo.height = 36;
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
  item.append(body);
  log.append(item);
  log.scrollTop = log.scrollHeight;
}

let submit = () => {};

function initCoach() {
  const form = document.querySelector("#coach-form");
  const input = document.querySelector("#coach-input");
  const log = document.querySelector("#chat-log");
  if (!form || !input || !log) return;
  let state = {};

  submit = async (text) => {
    const value = String(text || "").trim();
    if (!value) return;
    appendMessage(log, "user", { text: value });
    const result = await answerCoachWithAdapter(value, state);
    state = result.state || state;
    appendMessage(log, "robban", result);
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
    answerCoachWithAdapter(lessonId, state).then((result) => {
      state = result.state || state;
      appendMessage(log, "robban", result);
    });
  }
}

if (typeof document !== "undefined") initCoach();
