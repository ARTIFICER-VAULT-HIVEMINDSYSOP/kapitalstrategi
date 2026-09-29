# Developer handover — Kapitalstrategi

**Audience:** future developers joining the public site and related product surfaces.  
**Repo:** [ARTIFICER-VAULT-HIVEMINDSYSOP/kapitalstrategi](https://github.com/ARTIFICER-VAULT-HIVEMINDSYSOP/kapitalstrategi)  
**Live:** [https://www.kapitalstrategi.com](https://www.kapitalstrategi.com)  
**Status:** living document — keep it accurate; never commit secrets or customer data.

---

## 1. What this repository is

Public hosting for **Kapitalstrategi** (Kapital och Strategi): marketing pages, Tradingskolan (trading school), Trade Rider, and related client-facing pages.

What is actually in the tree:

- The main app is a **Vite production bundle already committed** as `index.html` plus `assets/`. There is no application source tree here.
- There is **no `package.json`**, no `src/`, and no `public/` directory. Do not assume an npm install or a local Vite project.
- Other pages and media are plain files (see section 7).
- Hosting is **GitHub Pages**. `.github/workflows/pages.yml` publishes the repo root. It does not run a build.
- Custom domain file: `CNAME` contains `www.kapitalstrategi.com`. DNS for the apex and `www` is managed outside this repo.
- `.nojekyll` is present so Pages serves the files as committed.

This is the **public** surface. Do not put private CRM exports, credentials, API keys, or customer PII here.

---

## 2. How to get a working tree

1. Fork or clone this repository.
2. Stop there for tooling. This repo does not define `npm ci`, `npm run dev`, `npm run build`, or `npm test`. Do not invent those commands until a `package.json` exists and lists them.
3. Edit the committed files. A change to the main app is a change to `index.html` and `assets/`. A change to school media, newsletters, or static HTML is a change to those directories.
4. Preview by serving the repo root as static files with a server you already have. This repository does not ship a preview script.
5. Open a pull request. Merge to `main` is what publishes the site (section 3).

---

## 3. Deploy path

Workflow: `.github/workflows/pages.yml` (`Deploy status to GitHub Pages`).

1. Change lands on a branch via pull request.
2. After review and merge to `main`, the workflow runs on that push. It can also be started with `workflow_dispatch`.
3. Steps: `actions/checkout@v4`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` with `path: .` (the whole repo), then `actions/deploy-pages@v4`. Environment name: `github-pages`.
4. `CNAME` must stay `www.kapitalstrategi.com`. DNS (apex `A` / `www` `CNAME`) must stay pointed at GitHub Pages for the custom domain to resolve. DNS is not in this repo.
5. If the site returns 5xx or wrong TLS, check the Actions run first, then DNS.

Never force-push to `main`. Never commit `.env` files or real secrets.

---

## 4. Product rails (paper vs live)

| Mode | Meaning for developers |
|------|-------------------------|
| **Paper / draft** | Safe default. UI, copy, and flows may ship as demos. No real money movement, no live trading orders from this surface without an explicit product go-live. |
| **Live** | Production behaviour that moves money, places orders, or sends customer email. Requires an explicit named approval from the product owner — not “looks ready”. |

Rules of thumb:

- Do not invent balances, prices, stop-loss/take-profit, or performance promises in UI copy.
- Client/CRM systems stay out of this public repo’s history and issues.
- Internal role nicknames and private ops jargon must **never** appear in customer-facing strings or in this document.

---

## 5. Surfaces you will meet

Routes below are the ones compiled into `assets/` (React Router). Confirm in the bundle before you rely on a path; there is no `src/` router to read.

| Surface | Where |
|---------|--------|
| Home | `/` |
| Kapital och Strategi | `/kapital-och-strategi` |
| Tradingskolan | `/tradingskolan` — lesson and course media under `school/` |
| Trade Rider | `/trade-rider` — separate static build also lives in `nvda-rider/` |
| Fastighetsskolan | `/fastighetsskolan` — related file under `property/` |
| Player Value | `/player-value` |
| Nyheter | `/nyheter` — edition JSON under `newsletters/` |
| Webtrader | `/webtrader` |
| Synergi | `/synergi` |
| UTR | `/utr` |
| Forskning | `/forskning` |
| Login | `/login` — treat auth as sensitive |
| Admin | `/admin` and nested admin paths — restricted; do not weaken gates or ship admin tooling without review |

Other static files (not SPA routes): `paper/`, `forms/` (including `forms/ks-escrow-terms.html`), `kampanjer/`, `brand/`.

Languages:

- The main app switches **Swedish**, **English**, and **Ukrainian**.
- `forms/ks-escrow-terms.html` is **Swedish**, **English**, and **French**.
- Keep existing languages in parity when you touch strings on a surface. Do not assume one language set covers every file.

Do not add customer-named routes, CRM exports, or personal documents under `forms/` or anywhere else.

---

## 6. Contribution checklist

Before opening a PR:

- [ ] Diff reviewed by hand (this repo has no test script)
- [ ] No secrets, tokens, `.env` values, or customer data in the diff
- [ ] No guaranteed returns or invented market figures in copy
- [ ] Customer-facing text free of internal ops slang
- [ ] Note which path you changed (`index.html` / `assets/`, a static directory, or both)
- [ ] Screenshots or short repro notes if you change UX
- [ ] Draft PR is fine; merge only after review

Preferred PR title style: short outcome (“Fix Pages 404 for /tradingskolan”, “Add strings for Trade Rider”).

---

## 7. Where to look in the tree

| Area | Location in this repo |
|------|------------------------|
| App shell (Vite bundle) | `index.html`, `assets/` |
| Trade Rider static build | `nvda-rider/` |
| Tradingskolan media | `school/` (`lessons/`, `courses/`, `concepts/`, `glossary/`, `invest/`, `videos/`, `escrow-kapital/`) |
| Newsletters | `newsletters/` |
| Campaign images | `kampanjer/` |
| Brand images | `brand/` |
| Papers and forms | `paper/`, `forms/` |
| Property file | `property/` |
| Icons and manifest | favicons, `icons.svg`, `site.webmanifest` |
| CI / Pages | `.github/workflows/pages.yml` |
| Domain | `CNAME` |
| Jekyll bypass | `.nojekyll` |
| Docs | this file and `README.md` |

If something is missing from this handover, update **this file in the same PR** that teaches the next developer.

---

## 8. Out of scope for this public repo

- Private CRM client cards and phone lists
- Production trading credentials and broker keys
- Partner whitelabel legal packs (handled under separate private tracks)
- Unsolicited scraping, credential stuffing, or bypass of auth

If you need access to a private system, ask the product owner — do not work around it in public commits.

---

## 9. Contact / ownership

- **Product owner:** Daniel Simonsson (Kapitalstrategi)
- **Issues / PRs:** use this GitHub repository
- **Site ops:** GitHub Pages + DNS for `kapitalstrategi.com` (`CNAME`: `www.kapitalstrategi.com`)

---

*Last updated: 2026-09-22 · Public developer handover · Keep free of secrets and personal data.*
