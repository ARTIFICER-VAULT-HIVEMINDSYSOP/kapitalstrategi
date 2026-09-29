/**
 * Client routes that must answer HTTP 200 on GitHub Pages.
 *
 * The Vite app source is not in this hosting repo. These paths are the
 * concrete routes from the production bundle (assets/index-*.js):
 * every `<Route path>` except "/" and the "*" fallback, plus each
 * `/admin/:section` the app links to. Query strings stay on the parent
 * route (`/tradingskolan?course=…` is still `/tradingskolan`).
 *
 * `scripts/copy-spa-routes.mjs` refuses to publish if this list drifts
 * from that bundle, so the bundle stays the source of truth.
 */

export const spaRoutes = [
  "admin",
  "admin/banks",
  "admin/content",
  "admin/contracts",
  "admin/courses",
  "admin/intel",
  "admin/invoices",
  "admin/lessons",
  "admin/newsletter",
  "admin/overview",
  "admin/pitch",
  "admin/portfolios",
  "admin/study",
  "admin/users",
  "archived-record/balans",
  "archived-record/shein",
  "batteri",
  "dashboard",
  "elnat",
  "fastighetsskolan",
  "forskning",
  "investeringskalkylator",
  "kapital-och-strategi",
  "login",
  "nyheter",
  "nyhetsbrev",
  "om-modellen",
  "player-value",
  "resultat",
  "signaler",
  "skatt",
  "synergi",
  "trade-rider",
  "tradingskolan",
  "utr",
  "verktyg",
  "verktyg/investeringskalkylator",
  "webtrader",
];

const ROUTE_PATH =
  /path:\s*`([^`]+)`\s*,\s*(?:element|children)\s*:/g;
const ADMIN_SECTION = /to:\s*`\/admin\/([A-Za-z0-9-]+)`/g;

/** Concrete paths the built router and admin nav actually serve. */
export function collectRequiredPaths(bundleSource) {
  const paths = new Set();
  for (const match of bundleSource.matchAll(ROUTE_PATH)) {
    const raw = match[1].replace(/^\/+|\/+$/g, "");
    if (!raw || raw === "*") continue;
    if (raw.split("/").some((segment) => segment.startsWith(":"))) continue;
    paths.add(raw);
  }
  for (const match of bundleSource.matchAll(ADMIN_SECTION)) {
    paths.add(`admin/${match[1]}`);
  }
  return [...paths].sort();
}

/** Paths present in the bundle but missing from `spaRoutes`, and the reverse. */
export function routeListDrift(bundleSource, routes = spaRoutes) {
  const required = collectRequiredPaths(bundleSource);
  const listed = [...routes].sort();
  const have = new Set(listed);
  const need = new Set(required);
  return {
    required,
    missing: required.filter((path) => !have.has(path)),
    extra: listed.filter((path) => !need.has(path)),
  };
}
