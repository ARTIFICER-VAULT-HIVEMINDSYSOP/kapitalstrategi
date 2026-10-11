/**
 * Bygger Kapitalnytt och Urbergsskölden.
 *
 * Skriver bara inlägg med status: godkand vars publiceras har passerat
 * i Europe/Stockholm. Utkast och amnesforslag.md lämnas orörda.
 *
 * Kör: node kapitalnytt/build.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildAll } from "./engine.mjs";

function main() {
  const report = buildAll();
  for (const section of report) {
    console.log(section.namn);
    if (!section.slugs.length) console.log("(inga)");
    for (const slug of section.slugs) console.log(`- ${slug}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
