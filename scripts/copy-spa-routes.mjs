#!/usr/bin/env node
/**
 * Postbuild: copy the Vite SPA shell to <dist>/<route>/index.html.
 *
 * GitHub Pages only returns 200 for a path when a file exists. Deep links
 * such as /tradingskolan otherwise fall through to 404.html (the same shell,
 * but status 404). A directory index keeps known client routes on 200.
 * 404.html is left in place for unknown paths.
 *
 * This hosting repo publishes the prebuilt site from the repository root,
 * so the Pages workflow runs:
 *   node scripts/copy-spa-routes.mjs --dist .
 * Pass --dist dist after a Vite build that writes dist/index.html.
 *
 * Asset URLs in the shell are root-absolute (base "/"). Relative href/src
 * values are rewritten to root-absolute so a copy under a subdirectory still
 * loads /assets, /modell and /nyheter.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { routeListDrift, spaRoutes } from "./spa-routes.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");

const ATTR =
  /\b(href|src)(\s*=\s*)(?:"([^"]*)"|'([^']*)')/g;

export function rootAbsoluteAssetUrl(value) {
  if (value == null) return value;
  const trimmed = value.trim();
  if (
    trimmed === "" ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
  ) {
    return value;
  }
  const url = new URL(trimmed, "https://pages.invalid/index.html");
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Make href/src work when index.html is served from a route subdirectory. */
export function absolutizeAssetUrls(html) {
  return html.replace(ATTR, (full, attr, eq, dq, sq) => {
    const value = dq !== undefined ? dq : sq;
    const quote = dq !== undefined ? '"' : "'";
    const next = rootAbsoluteAssetUrl(value);
    if (next === value) return full;
    return `${attr}${eq}${quote}${next}${quote}`;
  });
}

function bundlePathFromIndex(distDir, indexHtml) {
  const match = indexHtml.match(
    /<script\s+type="module"[^>]*\ssrc="([^"]+)"|<script\s+type="module"[^>]*\ssrc='([^']+)'/,
  );
  if (!match) {
    throw new Error(
      "dist/index.html has no <script type=\"module\" src>, so client routes cannot be checked.",
    );
  }
  const src = (match[1] ?? match[2]).replace(/^\//, "");
  if (src.includes("..") || path.isAbsolute(src)) {
    throw new Error(`Refusing module src "${src}".`);
  }
  return path.join(distDir, src);
}

function assertInside(distDir, target) {
  const root = path.resolve(distDir);
  const resolved = path.resolve(target);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error(`Refusing to write outside dist: ${target}`);
  }
}

function isSpaShell(html) {
  return html.includes('id="root"') && /assets\/index-[^"'\s>]+\.js/.test(html);
}

/**
 * @param {{ distDir: string, routes?: string[], checkBundle?: boolean }} options
 * @returns {string[]} routes written
 */
export function copySpaRoutes({
  distDir,
  routes = spaRoutes,
  checkBundle = true,
}) {
  const indexPath = path.join(distDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Missing SPA shell: ${indexPath}`);
  }
  const indexHtml = fs.readFileSync(indexPath, "utf8");
  if (!isSpaShell(indexHtml)) {
    throw new Error(`${indexPath} is not the Vite SPA shell.`);
  }

  if (checkBundle) {
    const bundlePath = bundlePathFromIndex(distDir, indexHtml);
    if (!fs.existsSync(bundlePath)) {
      throw new Error(`SPA bundle not found: ${bundlePath}`);
    }
    const drift = routeListDrift(fs.readFileSync(bundlePath, "utf8"), routes);
    if (drift.missing.length || drift.extra.length) {
      throw new Error(
        `scripts/spa-routes.mjs is out of date with ${path.relative(distDir, bundlePath)}.\n` +
          `missing: ${drift.missing.join(", ") || "(none)"}\n` +
          `extra: ${drift.extra.join(", ") || "(none)"}`,
      );
    }
  }

  const shell = absolutizeAssetUrls(indexHtml);
  const written = [];
  for (const route of routes) {
    if (typeof route !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(route)) {
      throw new Error(`Invalid route path: ${JSON.stringify(route)}`);
    }
    const dir = path.join(distDir, ...route.split("/"));
    assertInside(distDir, dir);
    const dest = path.join(dir, "index.html");
    if (fs.existsSync(dest)) {
      const current = fs.readFileSync(dest, "utf8");
      if (!isSpaShell(current)) {
        throw new Error(
          `Refusing to overwrite non-SPA page ${path.relative(distDir, dest)}.`,
        );
      }
    }
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dest, shell);
    written.push(route);
  }
  return written;
}

function distFromArgv(argv) {
  const index = argv.indexOf("--dist");
  if (index === -1) return repoRoot;
  const value = argv[index + 1];
  if (!value || value.startsWith("-")) {
    throw new Error("Usage: node scripts/copy-spa-routes.mjs [--dist <dir>]");
  }
  return path.resolve(value);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const distDir = distFromArgv(process.argv);
  const written = copySpaRoutes({ distDir });
  console.log(
    `Wrote ${written.length} SPA route shells under ${distDir} (404.html unchanged).`,
  );
  for (const route of written) console.log(`  /${route}`);
}
