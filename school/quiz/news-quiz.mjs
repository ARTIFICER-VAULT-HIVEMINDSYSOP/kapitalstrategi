/**
 * Daily news quiz: recipe checks, calendar-day streak, and copy.
 * Storage is local only (ks.newsQuiz.v1). No account and no server call.
 * Sources for the recipe stay in this comment: the published card texts.
 */

export const NEWS_QUIZ_KEY = "ks.newsQuiz.v1";
export const DONE_CAP = 60;
export const MILESTONES = [3, 7, 14, 30];
export const TIME_ZONE = "Europe/Stockholm";

export const AWARDS = {
  3: {
    id: "news-3",
    sv: "Nyhetsläsare 3",
    en: "News reader 3",
    uk: "Читач новин 3",
  },
  7: {
    id: "news-7",
    sv: "Nyhetsläsare 7",
    en: "News reader 7",
    uk: "Читач новин 7",
  },
  14: {
    id: "news-14",
    sv: "Nyhetsläsare 14",
    en: "News reader 14",
    uk: "Читач новин 14",
  },
  30: {
    id: "news-30",
    sv: "Nyhetsläsare 30",
    en: "News reader 30",
    uk: "Читач новин 30",
  },
};

export const BANNED = [
  "Status (internt)",
  "Ämnesrad (förslag)",
  "public/ipo-kalender.html",
  "rådgivning",
  "rådgivare",
  "investeringsrekommendation",
  "Fraunces",
  "Trade Rider",
  "trade-rider",
  "Traderider",
  "Avanza",
  "Nordnet",
  "eToro",
  "ÖB",
  "inte investeringsrådgivning",
  "not investment advice",
  "Utbildning, inte råd",
  "investeringsråd",
];

export function pickText(value, language = "sv") {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (language === "uk") return value.uk || value.en || value.sv || "";
  if (language === "en") return value.en || value.sv || "";
  return value.sv || "";
}

export function calendarDate(date, timeZone = TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const bag = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${bag.year}-${bag.month}-${bag.day}`;
}

export function addCalendarDays(iso, delta) {
  const [year, month, day] = String(iso).split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + delta, 12));
  return calendarDate(utc, "UTC");
}

export function emptyState() {
  return { lastDoneDate: null, streak: 0, best: 0, doneDates: [], unlocked: [] };
}

export function normalizeState(raw) {
  const base = emptyState();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const streak = Number.isFinite(raw.streak) && raw.streak > 0 ? Math.floor(raw.streak) : 0;
  const best = Number.isFinite(raw.best) && raw.best > 0 ? Math.floor(raw.best) : 0;
  const lastDoneDate = /^\d{4}-\d{2}-\d{2}$/.test(raw.lastDoneDate || "") ? raw.lastDoneDate : null;
  const doneDates = Array.isArray(raw.doneDates)
    ? raw.doneDates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)).slice(-DONE_CAP)
    : [];
  const unlocked = Array.isArray(raw.unlocked)
    ? [...new Set(raw.unlocked.filter((id) => Object.values(AWARDS).some((award) => award.id === id)))]
    : [];
  return {
    lastDoneDate,
    streak: lastDoneDate ? streak : 0,
    best: Math.max(best, streak),
    doneDates,
    unlocked,
  };
}

export function readState(storage, key = NEWS_QUIZ_KEY) {
  if (!storage || typeof storage.getItem !== "function") return emptyState();
  try {
    const raw = storage.getItem(key);
    if (raw == null || raw === "") return emptyState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return emptyState();
  }
}

export function writeState(storage, state, key = NEWS_QUIZ_KEY) {
  const safe = normalizeState(state);
  if (storage && typeof storage.setItem === "function") {
    storage.setItem(key, JSON.stringify(safe));
  }
  return safe;
}

/** A missed day clears the running streak and keeps the best. No message is attached. */
export function reconcileStreak(state, today) {
  const current = normalizeState(state);
  if (!current.lastDoneDate) return { ...current, streak: 0 };
  const yesterday = addCalendarDays(today, -1);
  if (current.lastDoneDate === today || current.lastDoneDate === yesterday) return current;
  return { ...current, streak: 0, best: current.best };
}

/**
 * Completing counts on the local day it is done, whatever the score.
 * Same day: +0. Next calendar day: +1. A gap starts again at 1 after the quiet reset.
 */
export function recordCompletion(state, today) {
  const current = reconcileStreak(state, today);
  if (current.lastDoneDate === today) {
    return { state: current, delta: 0, newlyUnlocked: [] };
  }
  const yesterday = addCalendarDays(today, -1);
  const streak = current.lastDoneDate === yesterday ? current.streak + 1 : 1;
  const best = Math.max(current.best, streak);
  const doneDates = [...current.doneDates.filter((date) => date !== today), today].slice(-DONE_CAP);
  const newlyUnlocked = [];
  const unlocked = [...current.unlocked];
  for (const days of MILESTONES) {
    const award = AWARDS[days];
    if (streak >= days && !unlocked.includes(award.id)) {
      unlocked.push(award.id);
      newlyUnlocked.push(award.id);
    }
  }
  return {
    state: { lastDoneDate: today, streak, best, doneDates, unlocked },
    delta: current.lastDoneDate === yesterday ? 1 : streak === 1 && current.streak === 0 ? 1 : 1,
    newlyUnlocked,
  };
}

export function nextMilestone(streak) {
  return MILESTONES.find((days) => days > streak) ?? null;
}

export function daysUntilMilestone(streak) {
  const next = nextMilestone(streak);
  return next == null ? 0 : next - streak;
}

export function milestoneLine(streak, language = "sv") {
  const next = nextMilestone(streak);
  if (next == null) {
    if (language === "en") return "The 30-day mark is already unlocked.";
    if (language === "uk") return "Позначку 30 днів уже відкрито.";
    return "Märket för 30 dagar är redan upplåst.";
  }
  const left = next - streak;
  const name = pickText(AWARDS[next], language);
  if (language === "en") {
    return left === 1 ? `1 day left until the mark ${name}` : `${left} days left until the mark ${name}`;
  }
  if (language === "uk") {
    return left === 1 ? `1 день до позначки ${name}` : `${left} днів до позначки ${name}`;
  }
  return left === 1 ? `1 dag kvar till märket ${name}` : `${left} dagar kvar till märket ${name}`;
}

export function streakLine(streak, language = "sv") {
  if (language === "en") return streak === 1 ? "Streak: 1 day" : `Streak: ${streak} days`;
  if (language === "uk") return streak === 1 ? "Серія: 1 день" : `Серія: ${streak} днів`;
  return streak === 1 ? "Svit: 1 dag" : `Svit: ${streak} dagar`;
}

export function teaserLine(quiz, language = "sv") {
  const topic = pickText(quiz?.teaser, language);
  if (topic) return topic;
  if (language === "en") return "New quiz tomorrow";
  if (language === "uk") return "Нова вікторина завтра";
  return "Nytt quiz i morgon";
}

export function teaserKicker(language = "sv") {
  if (language === "en") return "New quiz tomorrow";
  if (language === "uk") return "Нова вікторина завтра";
  return "Nytt quiz i morgon";
}

export function awardNote(language = "sv") {
  if (language === "en") {
    return "The mark is for learning and is not permission to trade. What was practised: reading the news carefully.";
  }
  if (language === "uk") {
    return "Позначка за навчання і не є дозволом торгувати. Що практикували: уважно читати новину.";
  }
  return "Märket är för lärandet och är inte ett tillstånd att handla. Det som övades: att läsa nyheten noga.";
}

export function newestQuizEdition(editions) {
  const list = (Array.isArray(editions) ? editions : [])
    .filter((edition) => edition && edition.quiz && Array.isArray(edition.quiz.questions) && edition.quiz.questions.length > 0)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return list[0] || null;
}

export function quizCorpus(quiz) {
  const chunks = [];
  const walk = (value) => {
    if (value == null) return;
    if (typeof value === "string") {
      chunks.push(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(quiz);
  return chunks.join("\n");
}

export function recipeIssues(quiz) {
  const issues = [];
  const questions = quiz?.questions;
  if (!Array.isArray(questions) || questions.length < 3 || questions.length > 5) {
    issues.push(`frågor ${questions?.length ?? 0}, ska vara 3–5`);
  }
  const positions = [];
  for (const question of questions || []) {
    const options = question.options || [];
    if (options.length !== 4) issues.push(`${question.id || "?"} har ${options.length} alternativ`);
    const correct = options.filter((option) => option.correct);
    if (correct.length !== 1) issues.push(`${question.id || "?"} har ${correct.length} rätta`);
    else positions.push(options.findIndex((option) => option.correct));
    for (const field of ["prompt", "explanation"]) {
      if (!pickText(question[field], "sv")) issues.push(`${question.id || "?"} saknar ${field}`);
    }
    if (!question.explanation) issues.push(`${question.id || "?"} saknar förklaring`);
  }
  if (positions.length > 1 && new Set(positions).size < 2) issues.push("rätt svar ligger på samma plats");
  const text = quizCorpus(quiz);
  for (const word of BANNED) {
    if (text.includes(word)) issues.push(`förbjudet ord: ${word}`);
  }
  return issues;
}

export function shuffleOptions(options, random = Math.random) {
  const copy = options.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const hold = copy[index];
    copy[index] = copy[swap];
    copy[swap] = hold;
  }
  return copy;
}

export function sectionOrder(edition, chosenDate) {
  const order = ["cards"];
  if (edition?.date === chosenDate && edition?.quiz) order.push("quiz");
  return order;
}
