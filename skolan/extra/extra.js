import { COURSES } from "../coach/kursinnehall.js";

const KEY = "ks.skolan.extra";

function unlocked() {
  const params = new URLSearchParams(location.search);
  const code = params.get("inbjudan") || "";
  if (/^[a-z2-9]{8}$/.test(code)) {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      return true;
    }
    return true;
  }
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function renderSheet() {
  const sheet = document.createElement("article");
  sheet.className = "sheet";
  const title = document.createElement("h2");
  title.textContent = "Extra kursblad";
  sheet.append(title);
  const lead = document.createElement("p");
  lead.textContent = "Samma blad för alla som öppnar en inbjudningslänk. Det är kursinnehåll.";
  sheet.append(lead);
  for (const course of COURSES) {
    const heading = document.createElement("h3");
    heading.textContent = course.title;
    sheet.append(heading);
    const summary = document.createElement("p");
    summary.textContent = course.summary;
    sheet.append(summary);
    const list = document.createElement("ul");
    for (const lesson of course.lessons) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `/skolan/coach/?lektion=${encodeURIComponent(lesson.id)}`;
      link.textContent = lesson.title;
      item.append(link);
      const text = document.createElement("p");
      text.textContent = lesson.summary;
      item.append(text);
      list.append(item);
    }
    sheet.append(list);
  }
  return sheet;
}

function init() {
  const root = document.querySelector("#extra-root");
  if (!root || !unlocked()) return;
  const locked = document.querySelector("#extra-locked");
  if (locked) locked.hidden = true;
  root.append(renderSheet());
}

if (typeof document !== "undefined") init();
