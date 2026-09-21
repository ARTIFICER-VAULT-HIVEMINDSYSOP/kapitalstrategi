# kapitalstrategi

Hosting for [kapitalstrategi.com](https://www.kapitalstrategi.com).

**Site:** Vite production build served from repo root via GitHub Pages (Actions).

**Custom domain:** `www.kapitalstrategi.com` is set by the `CNAME` file in this repo (merged in [PR #1](https://github.com/ARTIFICER-VAULT-HIVEMINDSYSOP/kapitalstrategi/pull/1)). Do not change that hostname.

## Enforce HTTPS (ÖB / repo admin)

The Pages API token used by agents cannot toggle `https_enforced`. After GitHub issues the custom-domain certificate (often a few minutes after the `CNAME` is on `main`):

1. Open **Settings → Pages**: https://github.com/ARTIFICER-VAULT-HIVEMINDSYSOP/kapitalstrategi/settings/pages
2. Under **Custom domain**, confirm `www.kapitalstrategi.com`.
3. If DNS is not green, click **Save** then **Check again**.
4. When the checkbox is enabled, tick **Enforce HTTPS**.

Success check (no `-k`):

```bash
curl -sI https://www.kapitalstrategi.com
echo | openssl s_client -connect www.kapitalstrategi.com:443 -servername www.kapitalstrategi.com 2>/dev/null \
  | openssl x509 -noout -ext subjectAltName
```

Expect HTTP 200 and a SAN that includes `www.kapitalstrategi.com` (not only `*.github.io`).

## Cloudflare (ÖB only)

Do **not** change `live.kapitalstrategi.com` (separate tunnel).

Remaining apex cleanup so apex HTTPS is not a random shared cert:

- Keep `www` as DNS-only (grey cloud) CNAME → `artificer-vault-hivemindsysop.github.io`
- Apex A records should be only GitHub Pages: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- Remove leftover apex A `199.36.158.100`
