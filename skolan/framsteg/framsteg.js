import { COURSES } from "../coach/kursinnehall.js";
import { STORAGE_KEY, awardsEarned, levelFromAwardCount, quizIdsFor } from "../niva.js";

const KEY = STORAGE_KEY;

function emptyState() {
  return { lessons: {}, quiz: {} };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      lessons: parsed.lessons && typeof parsed.lessons === "object" ? parsed.lessons : {},
      quiz: parsed.quiz && typeof parsed.quiz === "object" ? parsed.quiz : {},
    };
  } catch {
    return null;
  }
}

function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function lessons() {
  return COURSES.flatMap((course) => course.lessons.map((lesson) => ({ course, lesson })));
}

function quizItems() {
  const ids = COURSES.flatMap((course) => quizIdsFor(course.id));
  return ids.map((id) => {
    for (const course of COURSES) {
      const lesson = course.lessons.find((item) => item.id === id);
      if (lesson?.questions[0]) return { lesson, question: lesson.questions[0] };
    }
    return null;
  }).filter(Boolean);
}

function lessonDone(state) {
  const all = lessons();
  return all.length > 0 && all.every((item) => state.lessons[item.lesson.id]);
}

function quizDone(state) {
  return quizItems().every((item) => state.quiz[item.lesson.id] === true);
}

function render(state) {
  const root = document.querySelector("#framsteg-app");
  if (!root) return;
  const scrollY = window.scrollY;
  root.replaceChildren();

  if (!state) {
    const missing = document.createElement("p");
    missing.className = "status";
    missing.textContent = "Sparad markering: saknas.";
    root.append(missing);
    state = emptyState();
  }

  const all = lessons();
  const doneCount = all.filter((item) => state.lessons[item.lesson.id]).length;
  const steps = document.createElement("ol");
  steps.className = "stepper";
  const earned = awardsEarned(state);
  const flags = [lessonDone(state), quizDone(state), earned.length > 0];
  const labels = ["Lektioner", "Kunskapstest", "Utmärkelse"];
  labels.forEach((label, index) => {
    const step = document.createElement("li");
    const current = flags[index] ? "is-done" : flags.slice(0, index).every(Boolean) ? "is-current" : "";
    if (current) step.className = current;
    step.textContent = `${index + 1}. ${label}`;
    steps.append(step);
  });
  root.append(steps);

  const count = document.createElement("p");
  count.className = "status";
  count.textContent = `Lektioner markerade i den här webbläsaren: ${doneCount} av ${all.length}.`;
  root.append(count);

  for (const course of COURSES) {
    const group = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = course.title;
    group.append(legend);
    for (const lesson of course.lessons) {
      const label = document.createElement("label");
      label.className = "check";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = !!state.lessons[lesson.id];
      input.addEventListener("change", () => {
        state.lessons[lesson.id] = input.checked;
        save(state);
        render(state);
      });
      const link = document.createElement("a");
      link.href = `/skolan/coach/?lektion=${encodeURIComponent(lesson.id)}`;
      link.textContent = lesson.title;
      label.append(input, link);
      group.append(label);
    }
    root.append(group);
  }

  const quiz = document.createElement("section");
  quiz.className = "panel";
  const quizTitle = document.createElement("h2");
  quizTitle.textContent = "Kunskapstest";
  quiz.append(quizTitle);
  for (const item of quizItems()) {
    const block = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = item.question.prompt;
    block.append(legend);
    item.question.options.forEach((option, index) => {
      const label = document.createElement("label");
      label.className = "check";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = item.lesson.id;
      input.checked = state.quiz[item.lesson.id] === true && option.correct;
      input.addEventListener("change", () => {
        state.quiz[item.lesson.id] = option.correct;
        save(state);
        render(state);
      });
      label.append(input, document.createTextNode(option.text));
      block.append(label);
      if (index === 0) input.required = true;
    });
    if (state.quiz[item.lesson.id] === true) {
      const note = document.createElement("p");
      note.className = "ok-note";
      note.textContent = item.question.explanation;
      block.append(note);
    } else if (state.quiz[item.lesson.id] === false) {
      const note = document.createElement("p");
      note.className = "retry-note";
      note.textContent = "Inte den här gången. Läs lektionen hos Robban och försök igen.";
      block.append(note);
    }
    quiz.append(block);
  }
  root.append(quiz);

  const award = document.createElement("section");
  award.className = "award";
  const awardTitle = document.createElement("h2");
  awardTitle.textContent = "Utmärkelse";
  award.append(awardTitle);
  const levelLine = document.createElement("p");
  levelLine.textContent = `Robban är på nivå ${levelFromAwardCount(earned.length)} i den här webbläsaren.`;
  award.append(levelLine);
  for (const course of COURSES) {
    const row = document.createElement("p");
    row.className = "status";
    if (earned.includes(course.id)) {
      const figure = document.createElement("figure");
      figure.className = "award-figure";
      const photo = document.createElement("img");
      photo.src = "/brand/robban-portrait-transparent.png";
      photo.alt = "Robban Robotsson";
      photo.width = 96;
      photo.height = 96;
      const caption = document.createElement("figcaption");
      caption.textContent = `Utmärkelsen för ${course.title} finns i den här webbläsaren.`;
      figure.append(photo, caption);
      award.append(figure);
      row.textContent = `${course.title}: utmärkelsen finns här.`;
    } else {
      row.textContent = `${course.title}: utmärkelse saknas.`;
    }
    award.append(row);
  }
  const status = document.createElement("p");
  status.className = "status";
  status.textContent = earned.length ? `${earned.length} utmärkelser är markerade här.` : "Utmärkelse: saknas.";
  award.append(status);
  root.append(award);

  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "btn ghost";
  reset.textContent = "Rensa markeringarna i den här webbläsaren";
  reset.addEventListener("click", () => {
    state = emptyState();
    save(state);
    render(state);
  });
  root.append(reset);
  window.scrollTo(0, scrollY);
}

if (typeof document !== "undefined") render(load());
