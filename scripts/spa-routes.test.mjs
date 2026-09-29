import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  absolutizeAssetUrls,
  copySpaRoutes,
  rootAbsoluteAssetUrl,
} from "./copy-spa-routes.mjs";
import { collectRequiredPaths, routeListDrift, spaRoutes } from "./spa-routes.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readBundle() {
  const indexHtml = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
  const match = indexHtml.match(/<script type="module"[^>]*src="([^"]+)"/);
  assert.ok(match, "index.html module src");
  return fs.readFileSync(path.join(repoRoot, match[1].replace(/^\//, "")), "utf8");
}

test("spa route list matches the production bundle", () => {
  const drift = routeListDrift(readBundle());
  assert.deepEqual(drift.missing, []);
  assert.deepEqual(drift.extra, []);
  for (const required of [
    "tradingskolan",
    "trade-rider",
    "fastighetsskolan",
    "login",
  ]) {
    assert.ok(spaRoutes.includes(required), required);
  }
  assert.equal(collectRequiredPaths(readBundle()).includes("*"), false);
  assert.equal(spaRoutes.includes("404"), false);
});

test("relative asset URLs become root-absolute", () => {
  assert.equal(rootAbsoluteAssetUrl("/assets/app.js"), "/assets/app.js");
  assert.equal(rootAbsoluteAssetUrl("./assets/app.js"), "/assets/app.js");
  assert.equal(rootAbsoluteAssetUrl("assets/app.js"), "/assets/app.js");
  assert.equal(
    rootAbsoluteAssetUrl("https://fonts.googleapis.com/css2?family=Fraunces"),
    "https://fonts.googleapis.com/css2?family=Fraunces",
  );
  const html = absolutizeAssetUrls(
    '<script type="module" src="./assets/index-abc.js"></script><link rel="stylesheet" href="assets/index-abc.css">',
  );
  assert.match(html, /src="\/assets\/index-abc\.js"/);
  assert.match(html, /href="\/assets\/index-abc\.css"/);
});

test("copy writes a shell per route and leaves unknown paths and 404.html alone", () => {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), "ks-spa-"));
  const index = `<!doctype html><html><head>
    <script type="module" crossorigin src="./assets/index-test.js"></script>
    </head><body><div id="root"></div></body></html>`;
  fs.writeFileSync(path.join(dist, "index.html"), index);
  fs.writeFileSync(path.join(dist, "404.html"), "missing");
  fs.mkdirSync(path.join(dist, "assets"));
  fs.writeFileSync(
    path.join(dist, "assets", "index-test.js"),
    'path:`tradingskolan`,element:1 path:`login`,element:1 path:`*`,element:1',
  );
  fs.mkdirSync(path.join(dist, "modell"));
  fs.writeFileSync(
    path.join(dist, "modell", "index.html"),
    "<html><body>static model page</body></html>",
  );

  const written = copySpaRoutes({
    distDir: dist,
    routes: ["tradingskolan", "login"],
    checkBundle: true,
  });
  assert.deepEqual(written, ["tradingskolan", "login"]);

  const school = fs.readFileSync(path.join(dist, "tradingskolan", "index.html"), "utf8");
  assert.match(school, /src="\/assets\/index-test\.js"/);
  assert.match(school, /id="root"/);
  assert.match(school, /history\.replaceState/);
  assert.doesNotMatch(
    fs.readFileSync(path.join(dist, "index.html"), "utf8"),
    /history\.replaceState/,
  );
  assert.equal(fs.readFileSync(path.join(dist, "404.html"), "utf8"), "missing");
  assert.equal(fs.existsSync(path.join(dist, "not-a-route", "index.html")), false);
  assert.equal(
    fs.readFileSync(path.join(dist, "modell", "index.html"), "utf8"),
    "<html><body>static model page</body></html>",
  );

  fs.writeFileSync(path.join(dist, "login", "index.html"), "<html>not the spa</html>");
  assert.throws(
    () => copySpaRoutes({ distDir: dist, routes: ["login"], checkBundle: false }),
    /Refusing to overwrite/,
  );
});
