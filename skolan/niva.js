import { COURSES } from "./coach/kursinnehall.js";

export const STORAGE_KEY = "ks.skolan.framsteg.v1";

const QUIZ_BY_COURSE = {
  "bankernas-historia": ["bank-01-riksbanken-1668", "bank-05-delreservsystemet"],
  "marknadens-framtid": ["mf-02-algoritmer-och-ai", "mf-04-cbdc"],
};

export function quizIdsFor(courseId) {
  return QUIZ_BY_COURSE[courseId] || [];
}

export function levelFromAwardCount(count) {
  const n = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  if (n >= 2) return 3;
  if (n >= 1) return 2;
  return 1;
}

export function awardsEarned(state) {
  if (!state || typeof state !== "object") return [];
  const lessons = state.lessons && typeof state.lessons === "object" ? state.lessons : {};
  const quiz = state.quiz && typeof state.quiz === "object" ? state.quiz : {};
  const earned = [];
  for (const course of COURSES) {
    const lessonsDone = course.lessons.every((lesson) => lessons[lesson.id] === true);
    const quizDone = quizIdsFor(course.id).every((id) => quiz[id] === true);
    if (lessonsDone && quizDone) earned.push(course.id);
  }
  return earned;
}

export function stateForAwards(count) {
  const state = { lessons: {}, quiz: {} };
  const courses = count >= 2 ? COURSES : count === 1 ? [COURSES[0]] : [];
  for (const course of courses) {
    for (const lesson of course.lessons) state.lessons[lesson.id] = true;
    for (const id of quizIdsFor(course.id)) state.quiz[id] = true;
  }
  return state;
}

export function readAwardCount(storage) {
  try {
    const raw = storage?.getItem?.(STORAGE_KEY);
    if (!raw) return 0;
    return awardsEarned(JSON.parse(raw)).length;
  } catch {
    return 0;
  }
}

export const LEVEL_NEXT = {
  1: "kopplingar mellan de två kurserna, begrepp som delreserv, inflation, likviditet, hävstång och stop-loss, och en fråga i två steg",
  2: "hur ett signalkorts fält läses, en jämförelse av historiska exempel, en övning på simulerat underlag och följdfrågor",
};

export function levelWhy(level, awards) {
  if (level === 1) {
    return `Nivå 1 eftersom utmärkelser i den här webbläsaren är ${awards}. Robban förklarar en lektion i taget och ställer en enkel kontrollfråga.`;
  }
  if (level === 2) {
    return `Nivå 2 eftersom utmärkelser i den här webbläsaren är ${awards}. Robban kopplar lektioner mellan kurserna och tar begreppen djupare.`;
  }
  return `Nivå 3 eftersom utmärkelser i den här webbläsaren är ${awards}. Robban går djupare i samma kurskort. Djupet är mer kunskap.`;
}

export function nextLevelText(level) {
  if (level >= 3) {
    return "Fler utmärkelser gör svaret djupare i samma kurskort. Spärren är densamma.";
  }
  return `Nästa nivå låses upp med nästa utmärkelse. Den lägger till ${LEVEL_NEXT[level]}.`;
}

export const LIMITS =
  "Robban säger inte om du ska köpa eller sälja, bedömer inte vad som passar dig, anpassar inte signaler till dig och låser inte upp handel med riktiga pengar. Det här är inte personlig investeringsrådgivning. Utmärkelsen är inte ett tillstånd att handla.";

export const STORED = "Framstegen ligger bara i den här webbläsaren.";
