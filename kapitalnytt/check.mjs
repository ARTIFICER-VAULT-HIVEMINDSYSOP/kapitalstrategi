/**
 * Underhåll för Kapitalnytt och Urbergsskölden.
 *
 * Godkända inlägg ger fel. Utkast ger bara varningar.
 * Kör: node kapitalnytt/check.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkRepo } from "./engine.mjs";

function main() {
  const { failures, warnings } = checkRepo();
  for (const warning of warnings) console.warn(`varning: ${warning}`);
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.log("kontroll ok");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
