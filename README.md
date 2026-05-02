# Clover Digital — Marketing Site

The public marketing site for **Clover Digital** — digital employees for small businesses, headquartered in Springfield, Illinois.

Live: **[cloverdigital.com](https://cloverdigital.com)**

---

## Quick start

```bash
git clone <this-repo>
cd clover-digital-site
npm install
npm run dev
```

Vite dev server starts on `http://localhost:5173` with hot reload.

## Build & deploy

This site is hosted on **GitHub Pages** at the apex domain (`cloverdigital.com`, custom domain via `CNAME`).

```bash
./build.sh
```

`build.sh` does a small dance to handle Vite's hashed asset filenames in a static-hosted single-page-app context:

1. Temporarily rewrites `index.html` to point at source files (so dev mode works)
2. Runs `vite build` → `dist/`
3. Copies the new hashed JS/CSS into `assets/`
4. Rewrites `index.html` to reference the new hashed filenames
5. Cleans up

Then commit and push to `main` — GitHub Actions deploys to Pages automatically (typical propagation: 30-90 seconds).

> **Why not a standard `npm run build`?** GitHub Pages serves static files from the repo root, not a `dist/` subdirectory. The build script keeps the deployable HTML at the repo root while still using Vite's hashed-asset cache-busting.

## Tech stack

- **React 19** + **Vite 8** — single-page app
- **Tailwind v4** — utility CSS (only used in a few places; most styling is in `src/index.css`)
- **GitHub Pages** — static hosting
- **Google Workspace** — email + DMARC
- **Google Analytics 4** — `G-BGJBYZQXYL`
- **Google Search Console** + **Bing Webmaster Tools** — verified

## Repository structure

| Path | What's there |
|---|---|
| `index.html` | Root HTML, all `<head>` meta + JSON-LD schemas + static SEO content for crawlers |
| `src/App.jsx` | Main React component (single-file app — sections, modals, iMessage demo, FAQ) |
| `src/index.css` | All styling (CSS variables, components, responsive rules) |
| `src/main.jsx` | Vite entrypoint |
| `apps/operations-dashboard/` | Internal Clover Ops dashboard app, deployed separately on Vercel |
| `assets/` | **Tracked.** Built JS/CSS bundles for GitHub Pages |
| `dist/` | **Gitignored.** Vite build output (used as a staging area by `build.sh`) |
| `for/*.html` | Industry landing pages (home services, law firms, real estate, creative agencies) |
| `blog/*.html` | Blog posts (7) |
| `public/` | Static assets that pass through Vite untouched |
| `scripts/` | Asset generators (favicons, OG card, etc.) |
| `BRAND.md` | **Canonical brand guide** — voice, palette, typography, logo, motif rules |
| `SEO_PLAYBOOK.md` | **SEO/GEO action plan** — what's done, what's pending, off-site playbook |
| `llms.txt` / `llms-full.txt` | AI-assistant entity reference (canonical disambiguation) |
| `sitemap.xml` / `robots.txt` | Crawler directives |
| `CNAME` | GitHub Pages custom domain (`cloverdigital.com`) |

## Documentation

- **Brand voice, palette, typography** → [`BRAND.md`](BRAND.md)
- **SEO/GEO playbook** → [`SEO_PLAYBOOK.md`](SEO_PLAYBOOK.md)
- **AI-assistant reference** → [`llms.txt`](llms.txt) / [`llms-full.txt`](llms-full.txt)

If anything in `BRAND.md` ever conflicts with the code, **the code wins** — update the doc. CSS variables in `src/index.css` `:root` are the source of truth for all design tokens.

## Editing copy

Most copy lives in two places:

1. **`src/App.jsx`** — the React-rendered version users see (when JS is enabled)
2. **`index.html`** under `<div id="seo-content">` — the static fallback for crawlers that don't run JS

When you change copy, update **both**. The `seo-content` div is removed from the DOM after React mounts, so it's purely a crawler fallback — but it must mirror the React content so search engines see consistent messaging.

## Adding a blog post

1. Copy an existing `blog/*.html` as a template
2. Update title, meta description, canonical URL, OG tags, and Article + BreadcrumbList JSON-LD
3. Add the URL to `sitemap.xml` with today's `lastmod`
4. Add a link in `index.html`'s `seo-content` "Latest Articles" nav (so crawlers find it)

## Adding an industry landing page

1. Copy an existing `for/*.html` as a template
2. Same meta updates as a blog post
3. Add to `sitemap.xml` and the seo-content "Industries We Serve" nav

## Domain & DNS

- **Apex**: `cloverdigital.com` → GitHub Pages (`185.199.108.153` etc.)
- **Email**: Google Workspace MX
- **DMARC**: `v=DMARC1; p=quarantine`
- **Verifications in DNS TXT**: Google Search Console
- **Verification in `<meta>`**: Bing Webmaster Tools (`msvalidate.01`)

## Contact

Internal: `hello@cloverdigital.com` · `pons@cloverdigital.com`

## License

Proprietary. See [`LICENSE`](LICENSE). All rights reserved by Clover Digital LLC.
