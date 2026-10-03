/**
 * Make Bankernas historia visible without hunting for it.
 * Run from the repo root: node school/courses/patch-catalog.mjs (idempotent)
 * 1) Put bankernas-historia in the first catalog row (Xc), next to Marknadens historia.
 * 2) Render the "Kurser i spåret" <details> open by default.
 */
import fs from "node:fs";
const p = new URL("../../assets/index-CBayL6Go.js", import.meta.url);
let s = fs.readFileSync(p, "utf8");
const edits = [
  ["Xc=[`historia`,`basics-sprak`,`trading-grund`,`ipo`]",
   "Xc=[`historia`,`bankernas-historia`,`basics-sprak`,`trading-grund`,`ipo`]"],
  ["(`details`,{className:`ts-catalog-fold card`,children:",
   "(`details`,{className:`ts-catalog-fold card`,open:!0,children:"],
];
for (const [from, to] of edits) {
  if (s.includes(to)) continue;
  const n = s.split(from).length - 1;
  if (n !== 1) throw new Error(`expected 1 match, got ${n}: ${from}`);
  s = s.replace(from, to);
}
fs.writeFileSync(p, s);
console.log("ok");
