/**
 * Splice the Hopfield lesson into the committed Vite bundle.
 * Run from the repo root: node school/hopfield/patch-bundle.mjs
 *
 * Anchors below match assets/index-h-vLI-Je.js (source sha a03d57c).
 * The previous bundle index-CBayL6Go.js used different minified names
 * (quiz:As / Ms, function Hc, $a, X.jsx, function dpe, ue.module).
 */
import fs from "node:fs";
import { lesson, pathStep } from "./lesson.js";

const bundlePath = new URL("../../assets/index-h-vLI-Je.js", import.meta.url);
let s = fs.readFileSync(bundlePath, "utf8");

function once(label, from, to) {
  const n = s.split(from).length - 1;
  if (n === 0) {
    console.log("skip", label);
    return;
  }
  if (n !== 1) throw new Error(`${label}: expected 1 occurrence, found ${n}`);
  s = s.replace(from, to);
  console.log("ok", label);
}

function replaceLessonObject() {
  const marker = '{"moduleId":"hopfield-minne"';
  const start = s.indexOf(marker);
  if (start < 0) throw new Error("lesson object missing");
  if (s.indexOf(marker, start + 1) !== -1) throw new Error("lesson object appears more than once");
  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = -1;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) throw new Error("lesson object did not close");
  s = s.slice(0, start) + JSON.stringify(lesson) + s.slice(end);
}

if (s.includes("hopfield-minne")) {
  replaceLessonObject();
  console.log("replaced hopfield lesson object");
} else {
  once(
    "module",
    "quiz:cs}],us=[",
    `quiz:cs},${JSON.stringify(lesson)}],us=[`,
  );
  once(
    "path",
    "phase:`advanced`}];function yc(e,t){",
    `phase:\`advanced\`},${JSON.stringify(pathStep)}];function yc(e,t){`,
  );
}

once(
  "course-sv",
  "Avslutas med kunskapstest.`",
  "Avslutas med kunskapstest, och sist en lektion om minne och mönster.`",
);
once(
  "course-en",
  "Ends with a knowledge test.`",
  "Ends with a knowledge test, then a final lesson on memory and patterns.`",
);
once(
  "topics",
  "`Kalender`,`Quiz`],topicsEn:[`Trading intro`,`Leverage · throttle`,`S/L · seatbelt`,`T/P · life vest`,`R:R · helmet`,`Signals`,`Analysis`,`Calendar`,`Quiz`]",
  "`Kalender`,`Quiz`,`Mönster`],topicsEn:[`Trading intro`,`Leverage · throttle`,`S/L · seatbelt`,`T/P · life vest`,`R:R · helmet`,`Signals`,`Analysis`,`Calendar`,`Quiz`,`Patterns`]",
);

if (!s.includes("function qLoc(")) {
  once(
    "qloc",
    "function hl(e,t){let n=ml[e.moduleId]",
    "function qLoc(e,t){if(!Array.isArray(e))return[];let n=t===`uk`,r=t===`en`||n;return e.map(e=>({...e,prompt:n&&e.promptUk?e.promptUk:r&&e.promptEn?e.promptEn:e.prompt,explanation:n&&e.explanationUk?e.explanationUk:r&&e.explanationEn?e.explanationEn:e.explanation,options:(e.options||[]).map(e=>({...e,text:n&&e.textUk?e.textUk:r&&e.textEn?e.textEn:e.text}))}))}function hl(e,t){let n=ml[e.moduleId]",
  );
  once(
    "qz",
    "let _e=(0,v.useCallback)(async e=>{let t=zn(e)",
    "let qz=(0,v.useMemo)(()=>qLoc((g.find(e=>e.moduleId===k)??g[0])?.quiz??[],a),[k,a,p,g]);let _e=(0,v.useCallback)(async e=>{let t=zn(e)",
  );
  once(
    "quiz-prop",
    "(0,J.jsx)(_Z,{questions:fe.module.quiz,disabled:!W||N,onComplete:he}",
    "(0,J.jsx)(_Z,{questions:qz,disabled:!W||N,onComplete:he}",
  );
}

const hopfieldUi = `if(e.trim()===\`@hopfield\`){let o=typeof document==\`undefined\`?\`dark\`:document.documentElement.getAttribute(\`data-theme\`)\|\|\`dark\`;return(0,J.jsx)(\`iframe\`,{className:\`hopfield-frame\`,title:a===\`en\`?\`Hopfield demo\`:a===\`uk\`?\`Демонстрація мережі Гопфілда\`:\`Hopfield-demo\`,src:\`/school/hopfield/index.html?lang=\${a===\`uk\`?\`uk\`:a===\`en\`?\`en\`:\`sv\`}&theme=\${o===\`light\`?\`light\`:\`dark\`}\`,loading:\`lazy\`},\`hopfield-\${t}\`)}if(e.trim()===\`@quiet\`)return(0,J.jsxs)(\`p\`,{children:[a===\`en\`?\`The pause sits in \`:a===\`uk\`?\`Пауза є в модулі \`:\`Pausen finns i modulen \`,(0,J.jsx)(\`a\`,{href:\`/nyheter/2026-09-28/tyst-tid/\`,children:a===\`en\`?\`Quiet time before a decision\`:a===\`uk\`?\`Тиша перед рішенням\`:\`Tyst tid före beslut\`}),\`.\`]},\`quiet-\${t}\`);if(/^https?:\\/\\/\\S+$/.test(e.trim()))return(0,J.jsx)(\`p\`,{children:(0,J.jsx)(\`a\`,{href:e.trim(),target:\`_blank\`,rel:\`noopener noreferrer\`,children:e.trim()})},\`a-\${t}\`);`;

if (!s.includes("hopfield-frame")) {
  once("demo-ui", "return e.trimStart().startsWith(`⚠️`)?", hopfieldUi + "return e.trimStart().startsWith(`⚠️`)?");
}

const tableUi = `if(e.startsWith(\`@table \`)){let d;try{d=JSON.parse(e.slice(7))}catch{return(0,J.jsx)(\`p\`,{children:e},\`bad-table-\${t}\`)}return(0,J.jsx)(\`div\`,{className:\`ts-compare-wrap\`,children:(0,J.jsxs)(\`table\`,{className:\`ts-compare\`,children:[d.caption?(0,J.jsx)(\`caption\`,{children:d.caption}):null,(0,J.jsx)(\`thead\`,{children:(0,J.jsx)(\`tr\`,{children:(d.headers||[]).map((n,r)=>(0,J.jsx)(\`th\`,{scope:\`col\`,children:n},\`th-\${r}\`))})}),(0,J.jsx)(\`tbody\`,{children:(d.rows||[]).map((n,r)=>(0,J.jsx)(\`tr\`,{children:n.map((c,i)=>(0,J.jsx)(i===0?\`th\`:\`td\`,{scope:i===0?\`row\`:void 0,children:c},\`c-\${i}\`))},\`tr-\${r}\`))})]})},\`table-\${t}\`)}`;

if (!s.includes("ts-compare")) {
  once("table-ui", "if(e.trim()===`@hopfield`)", tableUi + "if(e.trim()===`@hopfield`)");
}

once(
  "link-label",
  "n=Wa(a,e.labelSv,e.labelEn);return(0,J.jsxs)(`li`",
  "n=Wa(a,e.labelSv,e.labelEn,e.labelUk);return(0,J.jsxs)(`li`",
);
once(
  "link-desc",
  "(a===`en`?e.descriptionEn:e.descriptionSv)&&(0,J.jsx)(`p`,{className:`muted ts-related-desc`,children:a===`en`?e.descriptionEn:e.descriptionSv})",
  "(a===`uk`?e.descriptionUk||e.descriptionEn:a===`en`?e.descriptionEn:e.descriptionSv)&&(0,J.jsx)(`p`,{className:`muted ts-related-desc`,children:a===`uk`?e.descriptionUk||e.descriptionEn:a===`en`?e.descriptionEn:e.descriptionSv})",
);
once(
  "path-label",
  "children:Wa(a,e.labelSv,e.labelEn)})]})},e.id)",
  "children:Wa(a,e.labelSv,e.labelEn,e.labelUk)})]})},e.id)",
);
once(
  "path-why",
  "title:Wa(a,e.whySv,e.whyEn),children:",
  "title:Wa(a,e.whySv,e.whyEn,e.whyUk),children:",
);
once(
  "next-label",
  "children:Wa(a,se.labelSv,se.labelEn)}),(0,J.jsxs)(`span`",
  "children:Wa(a,se.labelSv,se.labelEn,se.labelUk)}),(0,J.jsxs)(`span`",
);
once(
  "why-smart",
  "children:Wa(a,ce.whySv,ce.whyEn)}),ce.actionTo",
  "children:Wa(a,ce.whySv,ce.whyEn,ce.whyUk)}),ce.actionTo",
);

const checks = [
  ["lesson id", s.includes('"moduleId":"hopfield-minne"')],
  ["path step", s.includes('"id":"path-hopfield"')],
  ["frame", s.includes("hopfield-frame")],
  ["table", s.includes("ts-compare")],
  ["qloc", s.includes("function qLoc(") && s.includes("questions:qz,")],
  ["uk labels", s.includes("e.labelUk") && s.includes("e.whyUk") && s.includes("se.labelUk") && s.includes("ce.whyUk")],
];
const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  throw new Error(`post-checks failed: ${failed.map(([name]) => name).join(", ")}`);
}

fs.writeFileSync(bundlePath, s);
console.log("patched", bundlePath.pathname, "bytes", s.length);
