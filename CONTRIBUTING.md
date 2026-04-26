# Contributing — Clover Digital

Internal contributor guide for the marketing site. This repo is private to Clover Digital LLC.

## Branch & commit conventions

- Work on `main` directly for small content/copy tweaks. For anything spanning multiple files or touching schema/SEO, use a short-lived branch and PR.
- Commit messages use **Conventional Commits** prefixes:
  - `feat(scope):` new feature
  - `fix(scope):` bug fix
  - `style(scope):` styling / visual changes
  - `docs(scope):` docs only
  - `chore(scope):` build / tooling / cleanup
  - `refactor(scope):` no behavior change
  - Examples from this repo's history: `feat(seo): ...`, `style(demo): ...`, `fix(seo): ...`

## Before you push

1. Run `./build.sh` — must succeed
2. Verify `npm audit` is clean (we keep it at 0 vulnerabilities)
3. If you changed JSON-LD in `index.html`, validate with the Python one-liner in the build script comments or by pasting blocks into https://validator.schema.org
4. If you changed the iMessage demo data in `App.jsx`, hard-refresh the dev server and confirm the conversation animates and auto-scrolls correctly

## Editing copy

The site has two copies of most copy:

1. **`src/App.jsx`** — what JS-enabled visitors see (React-rendered)
2. **`index.html`** under `<div id="seo-content">` — static fallback for crawlers without JS

When you change copy, update both. Drift between them = mixed signals to search engines.

## Editing schema

All JSON-LD lives in `index.html` `<head>`. Seven blocks: Organization, Person (founder), BreadcrumbList, ProfessionalService, Service, FAQPage, WebSite.

- Lead the FAQPage with "What is Clover Digital?" — it's the canonical entity definition for AI assistants
- Keep `sameAs` arrays accurate (org GitHub, social profiles when claimed)
- Test changes at https://search.google.com/test/rich-results before pushing

## Brand & tone

Read [`BRAND.md`](BRAND.md) before writing customer-facing copy. Highlights:

- **Sound like:** a capable shop manager who writes well
- **Avoid:** "revolutionary," "cutting-edge," "synergy," "leverage"
- **Use:** italics for emphasis (not exclamation points)
- **Use:** sentence case in CTAs ("Book a call" not "Book A Call")

## SEO discipline

- Title ≤ 60 chars
- Description ≤ 160 chars
- Exactly one `<h1>` per rendered page
- New pages: add to `sitemap.xml` and to the `seo-content` nav block
- Don't break the `<div id="seo-content">` static block — it's the no-JS crawler fallback

See [`SEO_PLAYBOOK.md`](SEO_PLAYBOOK.md) for the full state.

## Dependencies

- Keep `npm audit` at zero. If a new dependency adds vulns, find an alternative or accept the risk explicitly in a PR comment.
- Don't add CSS-in-JS libraries (we standardize on CSS variables in `src/index.css`)

## Questions

Internal: `hello@cloverdigital.com`
