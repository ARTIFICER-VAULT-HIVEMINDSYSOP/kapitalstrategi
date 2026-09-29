/**
 * Remove the bundled lesson-01 MP4 from the committed Vite bundle.
 * Run from the repo root: node school/basics-01/patch-bundle.mjs
 *
 * The static map is `var In={…}`. Lesson 01 has no contentUk; Ukrainian
 * falls back to contentEn, so a contentUk body without a clip intro is added.
 */
import fs from "node:fs";

const bundlePath = new URL("../../assets/index-CBayL6Go.js", import.meta.url);
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

once(
  "static-media",
  'var In={"basics-01-samma-sprak":{moduleId:`basics-01-samma-sprak`,url:`/school/videos/basics-01-samma-sprak.mp4`,kind:`video`,mimeType:`video/mp4`,filename:`basics-01-samma-sprak.mp4`}};',
  "var In={};",
);

once(
  "summary-sv",
  "summary:`Se vår egen svenska lektionsvideo (MP4), därefter begrepp och tillgångar – så pratar vi samma språk. English-läge kan visa neutralt TED-Ed-klipp.`",
  "summary:`Begrepp och tillgångar – så pratar vi samma språk.`",
);

once(
  "topics-sv",
  "durationMinutes:12,topics:[`Video`,`Begrepp`,`Tillgångar`,`Risk`,`Quiz`],youtubeUrlEn:`https://www.youtube.com/watch?v=p7HKvqRI_Bo`",
  "durationMinutes:12,topics:[`Begrepp`,`Tillgångar`,`Risk`,`Quiz`],youtubeUrlEn:`https://www.youtube.com/watch?v=p7HKvqRI_Bo`",
);

once(
  "content-sv-intro",
  "content:[`# Start – se klippet först`,`1) I svenska gränssnittet spelas **vår egen lektionsvideo (MP4)** – inte klipp från andra handelsplattformar.`,`2) Byter du språk till English kan ett neutralt TED-Ed-klipp visas (pedagogik, inte en mäklare).`,`Sedan läser du vidare för gemensam ordlista.`,`# Varför den här lektionen?`,",
  "content:[`# Varför den här lektionen?`,",
);

once(
  "quiz-clip",
  "prompt:`Enligt klippet och lektionen – vad bestämmer i grunden en aktiekurs när du handlar?`",
  "prompt:`Enligt lektionen – vad bestämmer i grunden en aktiekurs när du handlar?`",
);

once(
  "summary-en",
  "summaryEn:`Watch our lesson video, then terms and assets – so we speak the same language. English mode may show a neutral TED-Ed clip.`",
  "summaryEn:`Terms and assets – so we speak the same language. A neutral TED-Ed clip shows how the stock market works.`",
);

once(
  "summary-uk",
  "summaryUk:`Подивіться відеоурок, потім терміни та активи – щоб говорити однією мовою.`",
  "summaryUk:`Терміни та активи – щоб говорити однією мовою.`",
);

once(
  "topics-en-uk",
  "topicsEn:[`Video`,`Terms`,`Assets`,`Risk`,`Quiz`],topicsUk:[`Відео`,`Терміни`,`Активи`,`Ризик`,`Тест`],contentEn:[",
  "topicsEn:[`Terms`,`Assets`,`Risk`,`Quiz`],topicsUk:[`Терміни`,`Активи`,`Ризик`,`Тест`],contentEn:[",
);

once(
  "content-en-intro",
  "contentEn:[`# Start – watch the clip first`,`1) In the Swedish UI our **own lesson video (MP4)** plays – not clips from other trading platforms.`,`2) Switch language to English and a neutral TED-Ed clip may appear (education, not a broker).`,`Then read on for a shared vocabulary.`,",
  "contentEn:[`# Start – watch the TED-Ed clip`,`The neutral TED-Ed clip above explains how the stock market works. It is education, not a broker.`,`Then read on for a shared vocabulary.`,",
);

function addContentUk() {
  const marker = "contentUk:[`# Why this lesson?`";
  if (s.includes(marker)) {
    console.log("skip content-uk");
    return;
  }
  const start = s.indexOf("contentEn:[`# Start – watch the TED-Ed clip`");
  if (start < 0) throw new Error("content-uk: rewritten contentEn intro missing");
  const bodyStart = s.indexOf("`# Why this lesson?`", start);
  const endTick = s.indexOf("small positions.`]", bodyStart);
  if (bodyStart < 0 || endTick < 0) throw new Error("content-uk: english lesson body missing");
  const body = s.slice(bodyStart, endTick + "small positions.`".length);
  const bracket = endTick + "small positions.`".length;
  if (s[bracket] !== "]" || s[bracket + 1] !== "}") {
    throw new Error(`content-uk: expected ]}, found ${JSON.stringify(s.slice(bracket, bracket + 2))}`);
  }
  s = `${s.slice(0, bracket)}],contentUk:[${body}]${s.slice(bracket + 1)}`;
  console.log("ok content-uk");
}

addContentUk();

once(
  "course-sv",
  "summarySv:`Begrepp och tillgångar, hävstång · R:R · S/L · T/P, plus ränta på ränta – med egen lektionsvideo (MP4).`",
  "summarySv:`Begrepp och tillgångar, hävstång · R:R · S/L · T/P, plus ränta på ränta.`",
);

once(
  "course-en",
  "summaryEn:`Terms and assets, leverage · R:R · S/L · T/P, plus compound interest – own lesson MP4 in Swedish UI; optional neutral YouTube in English mode.`",
  "summaryEn:`Terms and assets, leverage · R:R · S/L · T/P, plus compound interest. The first lesson can show a neutral TED-Ed clip in English mode.`",
);

once(
  "nudge-sv",
  '"nudge.basics.title":`Börja med samma språk – se videon`',
  '"nudge.basics.title":`Börja med samma språk`',
);

once(
  "nudge-en",
  '"nudge.basics.title":`Start with the same language – watch the video`',
  '"nudge.basics.title":`Start with the same language`',
);

once(
  "nudge-uk",
  '"nudge.basics.title":`Почніть з однієї мови – подивіться відео`',
  '"nudge.basics.title":`Почніть з однієї мови`',
);

once(
  "admin-flag",
  "preferVideo:t.moduleId===Gl",
  "preferVideo:!1",
);

once(
  "admin-gl",
  "var Gl=`basics-01-samma-sprak`;function Kl(e)",
  "function Kl(e)",
);

once(
  "summary-locale",
  "(0,X.jsx)(`p`,{className:`ts-summary`,children:ue.module.summary})",
  "(0,X.jsx)(`p`,{className:`ts-summary`,children:Rl(ue.module,a).summary})",
);

once(
  "compound-sv-clip",
  "topics:[`Ränta på ränta`,`Tid`,`Återinvestering`,`Video`,`Quiz`],youtubeUrlSv:`https://www.youtube.com/watch?v=za1Q4ZWRiWg`,youtubeTitleSv:`YouTube · Accountant Explains: The 8th Wonder – Compound Interest (engelska)`,youtubeUrlEn:`https://www.youtube.com/watch?v=za1Q4ZWRiWg`",
  "topics:[`Ränta på ränta`,`Tid`,`Återinvestering`,`Video`,`Quiz`],youtubeUrlSv:`https://www.youtube.com/watch?v=MvNGY5UzdF4`,youtubeTitleSv:`YouTube · Nordnet Academy: Vad är ränta på ränta-effekten?`,youtubeUrlEn:`https://www.youtube.com/watch?v=za1Q4ZWRiWg`",
);

once(
  "compound-sv-caption",
  "`1) Spela videoklippet (engelska – pedagogiskt, ca 5–10 min). 2) Svara på Robbans korta fråga. 3) Läs de korta avsnitten och gör quiz.`,`Klippet: **Accountant Explains: The 8th Wonder – Compound Interest**. Om en egen MP4 också finns kan du se den bredvid.`",
  "`1) Spela videoklippet (svenska, Nordnet Academy). 2) Svara på Robbans korta fråga. 3) Läs de korta avsnitten och gör quiz.`,`Klippet: **Nordnet Academy: Vad är ränta på ränta-effekten?**. I English-läge visas **Accountant Explains: The 8th Wonder – Compound Interest**. Om en egen MP4 också finns kan du se den bredvid.`",
);

once(
  "leverage-clips",
  "youtubeUrlEn:`https://www.youtube.com/watch?v=Tiyystl8x40`,youtubeTitleEn:`YouTube · Risk basics (optional English clip)`",
  "youtubeUrlSv:`https://www.youtube.com/watch?v=oUAhA_BXsNE`,youtubeTitleSv:`YouTube · Hävstång och risk`,youtubeUrlEn:`https://www.youtube.com/watch?v=Tiyystl8x40`,youtubeTitleEn:`YouTube · Order types: market, limit and stop`",
);

once(
  "admin-blurb",
  "[`Ladda upp bild eller MP4, och skapa Grok-voiceover (kräver XAI_API_KEY). Första basic-lektionen (`,(0,X.jsx)(`code`,{className:`mono`,children:`basics-01-samma-sprak`}),`) är avsedd för introduktionsvideo.`]",
  "[`Ladda upp bild eller MP4, och skapa Grok-voiceover (kräver XAI_API_KEY).`]",
);

const checks = [
  ["mp4 path gone", !s.includes("basics-01-samma-sprak.mp4")],
  ["static map empty", s.includes("var In={};function Ln(e){return In[e]??null}")],
  ["ted-ed kept", s.includes("https://www.youtube.com/watch?v=p7HKvqRI_Bo")],
  ["compound en kept", s.includes("youtubeUrlEn:`https://www.youtube.com/watch?v=za1Q4ZWRiWg`")],
  ["compound sv clip", s.includes("youtubeUrlSv:`https://www.youtube.com/watch?v=MvNGY5UzdF4`") && !s.includes("youtubeUrlSv:`https://www.youtube.com/watch?v=za1Q4ZWRiWg`")],
  ["leverage sv clip", s.includes("youtubeUrlSv:`https://www.youtube.com/watch?v=oUAhA_BXsNE`,youtubeTitleSv:`YouTube · Hävstång och risk`")],
  ["leverage en kept", s.includes("youtubeUrlEn:`https://www.youtube.com/watch?v=Tiyystl8x40`,youtubeTitleEn:`YouTube · Order types: market, limit and stop`") && !s.includes("Risk basics")],
  ["own mp4 copy gone", !s.includes("vår egen lektionsvideo") && !s.includes("own lesson video (MP4)") && !s.includes("own lesson MP4") && !s.includes("med egen lektionsvideo")],
  ["lesson video topic gone", !s.includes("topics:[`Video`,`Begrepp`") && !s.includes("topicsEn:[`Video`,`Terms`") && !s.includes("topicsUk:[`Відео`,`Терміни`")],
  ["compound video topic kept", s.includes("topics:[`Ränta på ränta`,`Tid`,`Återinvestering`,`Video`,`Quiz`]")],
  ["admin flag off", s.includes("preferVideo:!1") && !s.includes("preferVideo:t.moduleId===Gl")],
  ["summary follows language", s.includes("className:`ts-summary`,children:Rl(ue.module,a).summary}")],
  ["nudge compound kept", s.includes("Se lektionsvideon om ränta på ränta")],
];

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  throw new Error(`post-checks failed: ${failed.map(([name]) => name).join(", ")}`);
}

fs.writeFileSync(bundlePath, s);
console.log("patched", bundlePath.pathname, "bytes", s.length);
