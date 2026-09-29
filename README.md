# kapitalstrategi

Hosting for [kapitalstrategi.com](https://www.kapitalstrategi.com).

**Site:** Vite production build served from repo root via GitHub Pages (Actions).

Known client routes are copied to `<route>/index.html` during the Pages deploy (`scripts/copy-spa-routes.mjs`) so those URLs return 200. Unknown paths still use `404.html`.

**Custom domain:** Point DNS (CNAME/A) to GitHub Pages when the Actions deploy is green.
