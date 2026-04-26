<!--
  Quick PR checklist for the Clover Digital marketing site.
  Delete sections that don't apply.
-->

## What changed
<!-- One or two sentences -->

## Why
<!-- Business reason. Link to a brief, ticket, or chat if relevant. -->

## Visual / behavior verification
- [ ] Ran `./build.sh` — succeeded
- [ ] Hard-refreshed `cloverdigital.com` (or local dev server) and visually verified
- [ ] If schema changed: validated with https://search.google.com/test/rich-results
- [ ] If copy changed: updated **both** `src/App.jsx` AND `<div id="seo-content">` in `index.html` (so React + crawler-fallback stay in sync)
- [ ] If a new page was added: included in `sitemap.xml` AND linked from the `seo-content` nav block

## SEO / brand sanity
- [ ] Title ≤ 60 chars
- [ ] Description ≤ 160 chars
- [ ] Exactly 1 `<h1>` per page
- [ ] No "revolutionary / cutting-edge / synergy / leverage" language (see `BRAND.md`)
- [ ] CSS uses tokens from `src/index.css` `:root`, not raw hex

## Rollback plan
<!-- One-line revert command if this needs to come back out fast -->
```
git revert <commit-sha> --no-edit && ./build.sh && git add -A && git commit --amend --no-edit && git push
```
