/**
 * Idempotent quiz patch for the committed Vite bundle.
 * Run from the repo root: node school/quiz/patch-bundle.mjs
 *
 * English and Ukrainian fields are inserted on the existing Swedish items.
 * Bank and future questions are also updated inside school/courses/patch-bundle.mjs
 * so that script still matches the spliced module strings.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { appended, paragraphs } from "./extras.mjs";
import { translations } from "./i18n/index.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const bundlePath = path.join(repo, "assets/index-CBayL6Go.js");
const coursePatchPath = path.join(repo, "school/courses/patch-bundle.mjs");

const HELPERS = ["xs", "Cs", "Ts", "Ds", "ks"];

function esc(text, label) {
  const value = String(text);
  if (value.includes('"') || value.includes("\\") || value.includes("`") || value.includes("${")) {
    throw new Error(`unsafe character in ${label}: ${value.slice(0, 80)}`);
  }
  return value;
}

function braceSlice(source, start) {
  const open = source[start];
  const close = open === "{" ? "}" : open === "[" ? "]" : null;
  if (!close) throw new Error(`braceSlice: ${open} at ${start}`);
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (char === "`" || char === '"' || char === "'") {
      const quote = char;
      i += 1;
      while (i < source.length && source[i] !== quote) {
        if (source[i] === "\\") i += 1;
        i += 1;
      }
      continue;
    }
    if (char === open) depth += 1;
    else if (char === close) {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unclosed ${open} at ${start}`);
}

function readTemplate(source, tick) {
  if (source[tick] !== "`") throw new Error("expected template");
  let i = tick + 1;
  let text = "";
  while (i < source.length) {
    if (source[i] === "\\") {
      text += source[i + 1] ?? "";
      i += 2;
      continue;
    }
    if (source[i] === "`") return { text, end: i };
    text += source[i];
    i += 1;
  }
  throw new Error("unterminated template");
}

function insertAfterField(source, field, extra) {
  const token = `${field}:\``;
  const at = source.indexOf(token);
  if (at < 0) throw new Error(`missing field ${field}`);
  const before = at === 0 ? "" : source[at - 1];
  if (/[A-Za-z0-9]/.test(before)) throw new Error(`field boundary ${field}`);
  const { end } = readTemplate(source, at + token.length - 1);
  return source.slice(0, end + 1) + extra + source.slice(end + 1);
}

function patchOptions(source, row, id) {
  const at = source.indexOf("options:[");
  if (at < 0) throw new Error(`${id}: no options`);
  const array = braceSlice(source, at + "options:".length);
  let count = 0;
  const next = array.replace(
    /(xs|Cs|Ts|Ds|ks)\(`([a-d])`,`((?:\\`|[^`])*)`,(!0|!1)\)/g,
    (full, helper, letter, text, flag) => {
      const pair = row.options[letter];
      if (!pair) throw new Error(`${id}: missing option ${letter}`);
      count += 1;
      return `${helper}(\`${letter}\`,\`${text}\`,${flag},\`${esc(pair[0], id)}\`,\`${esc(pair[1], id)}\`)`;
    },
  );
  if (count !== 4) throw new Error(`${id}: expected 4 options, patched ${count}`);
  return source.slice(0, at + "options:".length) + next + source.slice(at + "options:".length + array.length);
}

function transformQuestion(objectText, row, id) {
  if (objectText.includes("promptEn:")) return objectText;
  let next = insertAfterField(
    objectText,
    "prompt",
    `,promptEn:\`${esc(row.promptEn, id)}\`,promptUk:\`${esc(row.promptUk, id)}\``,
  );
  next = patchOptions(next, row, id);
  next = insertAfterField(
    next,
    "explanation",
    `,explanationEn:\`${esc(row.explanationEn, id)}\`,explanationUk:\`${esc(row.explanationUk, id)}\``,
  );
  return next;
}

function patchQuestions(files, map) {
  for (const [id, row] of Object.entries(map)) {
    const marker = `{id:\`${id}\``;
    let found = 0;
    for (const file of files) {
      let from = 0;
      while (from < file.text.length) {
        const at = file.text.indexOf(marker, from);
        if (at < 0) break;
        const objectText = braceSlice(file.text, at);
        const next = transformQuestion(objectText, row, id);
        if (next !== objectText) {
          file.text = file.text.slice(0, at) + next + file.text.slice(at + objectText.length);
          from = at + next.length;
        } else {
          from = at + objectText.length;
        }
        found += 1;
      }
    }
    if (found < 1) throw new Error(`question not found: ${id}`);
  }
}

function replaceOnce(source, from, to, label) {
  const count = source.split(from).length - 1;
  if (count === 0) {
    if (!source.includes(to)) throw new Error(`${label}: anchor missing`);
    return source;
  }
  if (count !== 1) throw new Error(`${label}: expected 1, found ${count}`);
  return source.replace(from, to);
}

function upgradeHelpers(source) {
  let next = source;
  for (const name of HELPERS) {
    const from = `function ${name}(e,t,n){return{id:e,text:t,correct:n}}`;
    const to = `function ${name}(e,t,n,r,i){return{id:e,text:t,correct:n,...(r?{textEn:r}:{}),...(i?{textUk:i}:{})}}`;
    const count = next.split(from).length - 1;
    if (count === 0) {
      if (!next.includes(`function ${name}(e,t,n,r,i)`)) throw new Error(`helper ${name} missing`);
      continue;
    }
    if (count !== 1) throw new Error(`helper ${name}: ${count}`);
    next = next.replace(from, to);
  }
  return next;
}

function emitQuestion(question) {
  const options = question.options
    .map((option) => {
      const flag = option.correct ? "!0" : "!1";
      return `${question.helper}(\`${option.id}\`,\`${esc(option.text, question.id)}\`,${flag},\`${esc(option.textEn, question.id)}\`,\`${esc(option.textUk, question.id)}\`)`;
    })
    .join(",");
  return `{id:\`${question.id}\`,prompt:\`${esc(question.prompt, question.id)}\`,promptEn:\`${esc(question.promptEn, question.id)}\`,promptUk:\`${esc(question.promptUk, question.id)}\`,options:[${options}],explanation:\`${esc(question.explanation, question.id)}\`,explanationEn:\`${esc(question.explanationEn, question.id)}\`,explanationUk:\`${esc(question.explanationUk, question.id)}\`}`;
}

function appendExtras(source) {
  let next = source;
  for (const group of appended) {
    const emitted = group.questions.map(emitQuestion).join(",");
    if (group.kind === "needle") {
      if (group.questions.every((question) => next.includes(`id:\`${question.id}\``))) continue;
      const count = next.split(group.needle).length - 1;
      if (count !== 1) throw new Error(`${group.needle}: ${count}`);
      const replacement = `${group.needle.slice(0, -1)},${emitted}]`;
      next = next.replace(group.needle, replacement);
      continue;
    }
    const moduleAt = next.indexOf(`moduleId:\`${group.moduleId}\``);
    if (moduleAt < 0) throw new Error(`module missing ${group.moduleId}`);
    const quizAt = next.indexOf("quiz:[", moduleAt);
    if (quizAt < 0 || quizAt - moduleAt > 20000) throw new Error(`quiz missing ${group.moduleId}`);
    const bracket = quizAt + "quiz:".length;
    const arrayText = braceSlice(next, bracket);
    if (group.questions.every((question) => arrayText.includes(`id:\`${question.id}\``))) continue;
    const updated = `${arrayText.slice(0, -1)},${emitted}]`;
    next = next.slice(0, bracket) + updated + next.slice(bracket + arrayText.length);
  }
  return next;
}

function insertParagraphs(source) {
  let next = source;
  if (!next.includes(paragraphs.svMarker)) {
    const count = next.split(paragraphs.svAnchor).length - 1;
    if (count !== 1) throw new Error(`sv ratio anchor: ${count}`);
    next = next.replace(paragraphs.svAnchor, paragraphs.svAnchor + paragraphs.svInsert);
  }
  if (!next.includes(paragraphs.enMarker)) {
    const count = next.split(paragraphs.enAnchor).length - 1;
    if (count !== 1) throw new Error(`en ratio anchor: ${count}`);
    next = next.replace(paragraphs.enAnchor, paragraphs.enAnchor + paragraphs.enInsert);
  }
  return next;
}

function localizeCalls(source) {
  let next = source;
  const helper = `function quizPick(e,t,n,r){return r===\`uk\`?n||t||e||\`\`:r===\`en\`?t||e||\`\`:e||\`\`}function localizeLessonQuiz(e,t){return Array.isArray(e)?e.map(n=>({...n,prompt:quizPick(n.prompt,n.promptEn,n.promptUk,t),explanation:quizPick(n.explanation,n.explanationEn,n.explanationUk,t),options:Array.isArray(n.options)?n.options.map(e=>({...e,text:quizPick(e.text,e.textEn,e.textUk,t)})):n.options})):e}`;
  if (!next.includes("function localizeLessonQuiz(")) {
    const at = next.indexOf("function n8(");
    if (at < 0) throw new Error("n8 missing");
    next = next.slice(0, at) + helper + next.slice(at);
  }
  next = replaceOnce(next, "questions:ue.module.quiz", "questions:localizeLessonQuiz(ue.module.quiz,a)", "school quiz");
  next = replaceOnce(next, "questions:n.quiz", "questions:localizeLessonQuiz(n.quiz,t)", "fs quiz");
  return next;
}

function patchProgress(source) {
  let next = source;
  next = replaceOnce(
    next,
    "n.set(r.moduleId,{userId:r.userId,moduleId:r.moduleId,moduleTitle:r.moduleTitle||``,status:o?`completed`:r.status||`in_progress`,progressPercent:o?Math.max(a,100):a})",
    "n.set(r.moduleId,{userId:r.userId,moduleId:r.moduleId,moduleTitle:r.moduleTitle||``,status:o?`completed`:r.status||`in_progress`,progressPercent:o?Math.max(a,100):a,...(r.ratioQuizPassed||i?.ratioQuizPassed?{ratioQuizPassed:!0}:{})})",
    "merge ratio",
  );
  next = replaceOnce(
    next,
    "if(Array.isArray(t))return t.filter(t=>t&&t.moduleId).map(t=>({userId:t.userId||e,moduleId:t.moduleId,moduleTitle:t.moduleTitle||``,status:t.status||`in_progress`,progressPercent:Number(t.progressPercent)||0}))",
    "if(Array.isArray(t))return t.filter(t=>t&&t.moduleId).map(t=>({userId:t.userId||e,moduleId:t.moduleId,moduleTitle:t.moduleTitle||``,status:t.status||`in_progress`,progressPercent:Number(t.progressPercent)||0,...(t.ratioQuizPassed?{ratioQuizPassed:!0}:{})}))",
    "read school ratio",
  );
  next = replaceOnce(
    next,
    "if(Array.isArray(n?.steps))return n.steps.filter(t=>t&&t.moduleId).map(t=>({userId:e,moduleId:t.moduleId,moduleTitle:t.moduleTitle||``,status:t.status||`in_progress`,progressPercent:Number(t.progressPercent)||0}))",
    "if(Array.isArray(n?.steps))return n.steps.filter(t=>t&&t.moduleId).map(t=>({userId:e,moduleId:t.moduleId,moduleTitle:t.moduleTitle||``,status:t.status||`in_progress`,progressPercent:Number(t.progressPercent)||0,...(t.ratioQuizPassed?{ratioQuizPassed:!0}:{})}))",
    "read steps ratio",
  );
  next = replaceOnce(
    next,
    "n.steps=t.map(e=>({moduleId:e.moduleId,moduleTitle:e.moduleTitle||``,status:e.status,progressPercent:e.progressPercent??0}))",
    "n.steps=t.map(e=>({moduleId:e.moduleId,moduleTitle:e.moduleTitle||``,status:e.status,progressPercent:e.progressPercent??0,...(e.ratioQuizPassed?{ratioQuizPassed:!0}:{})}))",
    "save steps ratio",
  );
  next = replaceOnce(
    next,
    "async function de(e,t,n,o){if(!K?.userId){I($a(a,`Logga in för att spara ditt kursframsteg.`,`Log in to save your course progress.`));return}P(!0),I(null),R(null);let s={userId:K.userId,moduleId:e,moduleTitle:t,status:n,progressPercent:o};",
    "async function de(e,t,n,o,c){if(!K?.userId){I($a(a,`Logga in för att spara ditt kursframsteg.`,`Log in to save your course progress.`));return}P(!0),I(null),R(null);let u=C.some(t=>t.moduleId===e&&t.ratioQuizPassed),s={userId:K.userId,moduleId:e,moduleTitle:t,status:n,progressPercent:o,...(c||u?{ratioQuizPassed:!0}:{})};",
    "save de ratio",
  );
  next = replaceOnce(
    next,
    "let r=e>=70?`completed`:`in_progress`,i=e>=70?100:Math.max(ue.progressPercent,Math.min(90,e));de(ue.module.moduleId,ue.module.moduleTitle,r,i)",
    "let r=e>=70?`completed`:`in_progress`,i=e>=70?100:Math.max(ue.progressPercent,Math.min(90,e)),q=ue.module.moduleId===`hist-04-risk-sl-tp`&&Array.isArray(n)&&[`hist4-ratio-q1`,`hist4-ratio-q2`].every(t=>n.some(e=>e.id===t&&e.correct));de(ue.module.moduleId,ue.module.moduleTitle,r,i,q)",
    "pe ratio",
  );
  return next;
}

function retireOldQuiz(source) {
  return replaceOnce(source, "(0,X.jsx)(Yce,{date:te})", "null", "retire Yce");
}

function extractConst(source, name) {
  const token = `const ${name} = "`;
  const start = source.indexOf(token);
  if (start < 0) throw new Error(`missing ${name}`);
  const quote = start + token.length - 1;
  let i = quote + 1;
  while (i < source.length) {
    if (source[i] === "\\") {
      i += 2;
      continue;
    }
    if (source[i] === '"') return source.slice(quote + 1, i);
    i += 1;
  }
  throw new Error(`unterminated ${name}`);
}

function assertCourseStrings(bundle, courseSource) {
  const bank = extractConst(courseSource, "bankModules");
  const future = extractConst(courseSource, "mfModules");
  if (!bundle.includes(`,bankMods=${bank},`)) throw new Error("bankMods string diverged from course patch");
  if (!bundle.includes(`,mfMods=${future},`)) throw new Error("mfMods string diverged from course patch");
}

function main() {
  const files = [
    { path: bundlePath, text: fs.readFileSync(bundlePath, "utf8") },
    { path: coursePatchPath, text: fs.readFileSync(coursePatchPath, "utf8") },
  ];
  const [bundle, course] = files;
  patchQuestions(files, translations);
  bundle.text = upgradeHelpers(bundle.text);
  bundle.text = appendExtras(bundle.text);
  bundle.text = insertParagraphs(bundle.text);
  bundle.text = localizeCalls(bundle.text);
  bundle.text = patchProgress(bundle.text);
  bundle.text = retireOldQuiz(bundle.text);
  assertCourseStrings(bundle.text, course.text);
  for (const file of files) fs.writeFileSync(file.path, file.text);
  console.log("quiz patch wrote", path.relative(repo, bundlePath), "and", path.relative(repo, coursePatchPath));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
