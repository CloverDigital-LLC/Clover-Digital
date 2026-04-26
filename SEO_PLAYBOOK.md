# Clover Digital — SEO & GEO Playbook

**Goal:** rank #1 on Google for "clover digital" and be the canonical "Clover Digital" that AI assistants (ChatGPT, Claude, Perplexity, Gemini) cite for relevant queries.

**Reality check:** "Clover Digital" is a crowded name. At least 7 other companies use some form of it:
- Clover Network / Clover POS (Fiserv — the biggest "Clover" SERP competitor)
- cloverdigital.eu (EU marketing agency)
- cloverdigital.io (education/senior care resources)
- cloverdigitalsolutions.com (real estate marketing)
- cloverdigitalmedia.com (Michigan boutique media)
- cloverdigital.com.my (Malaysian industrial automation)
- cloverdigitalbrands.com (learning resources)
- gocloverdigital.com (digital services agency)

Our structural advantage: **we own `cloverdigital.com` (the exact-match `.com`)**. That's a major ranking factor for the branded query. What's missing is brand authority signals — which is what this playbook builds.

Code-side on-page SEO is already strong (schema, static content for crawlers, sitemap, FAQ, blog). Remaining work is **off-site** — and almost all of it requires Mason's accounts.

---

## What's Already Done (verified 2026-04-21)

- ✅ **Google Search Console verified** (DNS TXT `google-site-verification=uA_iYCCBUtHL_zmiBJsnd9tTXnFuY6m4KZIWiTb5e8A`)
- ✅ **Google Analytics 4** installed (`G-BGJBYZQXYL` in `index.html`)
- ✅ **Google Workspace** active — MX records resolve, `hello@` and `pons@cloverdigital.com` live
- ✅ **DMARC configured** (`v=DMARC1; p=quarantine`) — email auth good
- ✅ **Google Business Profile created** (inherited from Prairie Digital, migrated to Clover Digital branding)
- ✅ **On-page SEO** — schema (7 JSON-LD blocks), sitemap, robots, static HTML for crawlers, blog (7 posts), industry landing pages (4), FAQ (14 entries), BreadcrumbList, OG/Twitter cards, favicons
- ✅ **`llms.txt` + `llms-full.txt`** with canonical entity definition + disambiguation vs. other Clover Digitals
- ✅ **BRAND.md** — canonical brand doc in repo root
- ✅ **SSL / Let's Encrypt** active
- ✅ **Exact-match `.com` domain** (the biggest single SEO lever for a branded query)

## What's Actually Still Missing

Priority order by effort-to-impact:

1. 🔴 **GBP video verification** — prairie-fleet task `e71e1253`, assigned to Mason. Biggest local-pack ranking lever. 15 min of filming + 3-5 days Google-side review.
2. 🔴 **Bing Webmaster Tools** — not verified (no `msvalidate.01` meta, no DNS TXT). **ChatGPT web browsing and Copilot use Bing's index.** 5 min: import verification from GSC.
3. 🟡 **LinkedIn Company Page** — confirmed 404 at `/company/clover-digital`. Memory confirms deferred pre-rebrand. ~20 min to create. Appears in SERP for branded queries.
4. 🟡 **X handle `@cloverdigital`** — your existing `@masoncags` is Abstract-venture / personal. Corporate handle not claimed. 5 min to claim (handle-squat defense even if unused).
5. 🟡 **Crunchbase listing** — no public entry in SERPs. ~30 min to submit. Heavy weight in Perplexity/ChatGPT answers.
6. 🟢 **Directory citations** with consistent NAP (Clutch, BBB, Yelp, Springfield Chamber, Illinois SBDC, Product Hunt, G2, Capterra)
7. 🟢 **Backlinks & press** (rebrand angle, first-client case study once live, HARO/Qwoted, local press)
8. 🟢 **Ongoing content** (blog cadence, case studies)
9. 🟢 **`sameAs` update** — once the above social URLs exist, add them all to `index.html` Organization schema + `llms-full.txt`

Legend: 🔴 critical · 🟡 high · 🟢 compound over time

**Skipping my original Priority 1 (GSC) and 2 (domain verify) — you've done both.**

---

## 1. Google Search Console (ALREADY VERIFIED — use it)

Domain is verified (DNS TXT confirmed 2026-04-21). Login: https://search.google.com/search-console

### This-week actions (may already be done — confirm)
- [ ] **Sitemap submitted**: `https://cloverdigital.com/sitemap.xml`
- [ ] **Request indexing** for: `/`, `/for/home-services.html`, `/for/law-firms.html`, `/for/real-estate.html`, `/for/creative-agencies.html`, and every blog post
- [ ] **Re-request indexing on `/`** now that the entity-definition paragraph + founder schema shipped today (2026-04-21)

### Ongoing
- Weekly: Performance → filter by query "clover digital" — watch impressions/clicks/average position
- Weekly: Coverage → fix anything "Discovered — currently not indexed"
- Enhancements: verify Breadcrumb, FAQ, Organization structured data all pass (they should — 7 JSON-LD blocks validated locally before push)

---

## 2. Google Business Profile (CRITICAL — already on your task board)

Task ID on prairie-fleet: `e71e1253` — "Complete Google Business Profile video verification for Clover Digital rebrand."

Steps:
1. Sign in at https://business.google.com with the Clover Workspace account
2. Find the pending Clover Digital profile (previously Prairie Digital — you migrated)
3. Complete the **video verification** — record a short video showing:
   - The physical location / business address signage OR work-in-progress (doesn't need to be a storefront, but needs to show real business activity)
   - Walking into the workspace
   - Yourself on camera briefly with verbal confirmation
4. Submit. Verification typically 3–5 business days.

Once verified:
- Fill 100% of the profile. Business description ≥ 750 characters. Categories: Business Management Consultant (primary) + Marketing Agency + IT Services.
- Add **Services**: list each of the 6 digital-employee service areas with descriptions (copy from `llms-full.txt`).
- **Hours**: 9am–5pm Mon–Fri (matches your JSON-LD).
- Upload **≥ 10 photos**: logo, office/workspace, team, anything branded. Re-upload weekly for first month (freshness signal).
- **Write first Google Post** announcing the rebrand from Prairie Digital to Clover Digital. Include keyword "Clover Digital" prominently.
- **Request reviews** from your first clients. 5 reviews = visibility threshold.

---

## 3. Bing Webmaster Tools

Bing's index powers ChatGPT web browsing, DuckDuckGo, Yahoo, and (indirectly) many AI assistants. Non-optional for GEO.

1. Go to https://www.bing.com/webmasters
2. Add site: `https://cloverdigital.com`
3. Verify (you can import from GSC once GSC is done — faster)
4. Submit sitemap
5. Use "URL Inspection" to request indexing of homepage + all key pages

---

## 4. Social Profile Claim Sprint (do in one sitting)

Claim the handle `cloverdigital` on each before a squatter does. Even if you don't post actively, claiming protects the brand and adds `sameAs` signals.

- [ ] **LinkedIn Company Page** — https://www.linkedin.com/company/setup/new/
  - Industry: Information Technology & Services OR Business Consulting & Services
  - Tagline: "Reliable digital employees for small businesses across the heartland."
  - Company size: 1–10
  - Website: https://cloverdigital.com
  - Add logo + cover photo (cover can be the OG card)
  - Post once ("We're live.") to seed the feed
- [ ] **X (Twitter)** — @cloverdigital (check availability; fallbacks: @clover_digital, @cloverdigitalllc)
- [ ] **Facebook Page** — /cloverdigital (matters less, but reserves the name)
- [ ] **Instagram** — @cloverdigital (same)
- [ ] **YouTube** — @cloverdigital (same)
- [ ] **Crunchbase** — https://www.crunchbase.com/add-new — submit Clover Digital as a new organization. Fill fully. Crunchbase is heavily weighted by AI assistants and appears in the Knowledge Graph.
- [ ] **Substack** — cloverdigital.substack.com (reserve even if you don't start a newsletter today)
- [ ] **Reddit** — u/cloverdigital
- [ ] **Bluesky** — cloverdigital.bsky.social
- [ ] **Threads** — @cloverdigital
- [x] **GitHub Organization** — repo lives at https://github.com/cloverdigital-llc/Clover-Digital (transferred 2026-04-26 from Masoncags-tech personal account). `sameAs` already points at the org.

**Once these exist**, update `index.html`'s Organization schema `sameAs` array to include every live URL, and add them to `llms-full.txt` under the Company section. This is how Google builds the Knowledge Graph entity for "Clover Digital."

---

## 5. Directory Citations (NAP consistency is the key)

Every listing needs **identical** NAP (Name, Address, Phone):

```
Clover Digital LLC
Springfield, IL 62701 (or your exact address)
(217) 303-4601
hello@cloverdigital.com
https://cloverdigital.com
```

### Must-have (high authority)
- [ ] **Clutch.co** — https://clutch.co/join-us (B2B directory, AI-cited)
- [ ] **Yelp for Business** — https://biz.yelp.com
- [ ] **Better Business Bureau** — https://www.bbb.org/get-accredited (paid, but strong local signal)
- [ ] **Yellow Pages** — https://www.yellowpages.com (free basic listing)
- [ ] **Manta** — https://www.manta.com (free)

### Springfield / Illinois specific
- [ ] **Greater Springfield Chamber of Commerce** — https://www.gscc.org/join (paid membership = local authority + mention on their site)
- [ ] **Illinois Tech Association / Illinois Technology Council**
- [ ] **Springfield Business Journal** — directory + potential press
- [ ] **Enjoy Illinois business directory**
- [ ] **Springfield Convention & Visitors Bureau** (if applicable)
- [ ] **SCORE Central Illinois** — free mentorship + directory listing
- [ ] **Illinois Small Business Development Center (SBDC)**

### AI / B2B specific
- [ ] **Product Hunt** — launch Clover Digital (the page, not the service)
- [ ] **There's An AI For That** — https://theresanaiforthat.com
- [ ] **Futurepedia** — https://www.futurepedia.io
- [ ] **AI Agents Directory** — https://aiagentsdirectory.com
- [ ] **G2** — https://www.g2.com/products/new (even if no reviews yet)
- [ ] **Capterra** — https://www.capterra.com/vendors/sign-up
- [ ] **GetApp** — https://www.getapp.com (Gartner network)

Use a NAP consistency tracker spreadsheet. Every new listing, paste the same NAP verbatim.

---

## 6. Backlink & Brand Mention Strategy

Goal: 10–25 real, editorially-earned links in the first 90 days.

### Easy early wins
- [ ] Get listed on **SCORE** mentor pages (they list mentees' companies)
- [ ] Illinois **SBDC** client spotlight
- [ ] **Alumni page** at any school you attended (UIUC, etc.)
- [ ] Any **church, civic group, or local organization** you're part of — ask for a "supporter" or "member" mention
- [ ] Get friends with blogs/newsletters to write one genuine mention

### Local press angles
- **Angle 1 — rebrand story**: Prairie Digital → Clover Digital, why we changed, what we're building. Pitch to *Springfield Business Journal*, *The State Journal-Register*, *Illinois Times*.
- **Angle 2 — first client case study**: once you land & ship with a local business, write it up as a short case study + pitch as "local business uses AI to save X hours/week."
- **Angle 3 — Midwest AI**: pitch *Chicago Inno*, *Illinois Business Daily*, or *Crain's Chicago Business* as "Springfield-based founder building AI workforce for Main Street."

### Editorially-strong content
- [ ] Guest post on 2–3 Midwest business publications
- [ ] Podcast appearances (search Apple Podcasts for Springfield IL / Illinois / Midwest small business podcasts, send a short pitch)
- [ ] **HARO / Qwoted / Featured** — sign up for free, respond to queries from journalists where you have expertise (AI, small business, automation, remote work). 1–2 responses/week → steady pipeline of earned mentions.

---

## 7. AI / Generative Engine Optimization (GEO)

**What matters here:** AI assistants need to find you, understand you, and disambiguate you from other Clover Digitals.

### What's already shipped (2026-04-21)
- `llms.txt` + `llms-full.txt` with canonical definition + disambiguation vs. other Clover Digitals
- FAQ schema leading with "What is Clover Digital?"
- Founder (Mason Cagnoni) in Organization schema + standalone Person schema
- Static HTML renders full content for non-JS crawlers
- Brand-name density (Clover Digital appears in H1 area, FAQ, headers, footer)

### Test it
After DNS propagates + indexing happens:
- Ask ChatGPT (with web): "What is Clover Digital?" → expected answer mentions Springfield, Mason Cagnoni, digital employees.
- Ask Claude: same.
- Ask Perplexity: same. Watch the sources — they should include cloverdigital.com.
- Ask Gemini: same.
- Ask Bing / Copilot: same.

If any of them conflate you with another Clover Digital, check your Bing Webmaster Tools coverage, then file feedback through each product's correction interface. Most have a "report incorrect answer" flow.

### Ongoing GEO habits
- Write one blog post per month that teaches something specific (not promotional). AI assistants cite teaching content, not landing pages.
- Answer a few Quora / Reddit / Stack Exchange questions relevant to small-business automation with Clover Digital mentioned naturally in bio. This builds cited-by-humans-and-AIs signals.
- Keep `llms-full.txt` updated with new services, client industries, team members, etc.

---

## 8. Tracking & Measurement

### Week 1–2 after verifying GSC
- Impressions for "clover digital": > 0 (first signal Google is indexing)
- Average position for "clover digital": <50 (top 5 pages)

### Month 1
- Average position for "clover digital": <10 (first page)
- Google Knowledge Panel appears (may require more brand signals)

### Month 2–3
- Average position for "clover digital": 1–3 (top 3)
- Clover Digital appears in AI assistant answers without disambiguation needed

### Month 6
- Average position: 1
- Domain rating climbing (Ahrefs, Moz) as backlinks accumulate
- GBP has 5+ reviews
- Knowledge Panel live

### Tools
- **Google Search Console** — free, essential
- **Bing Webmaster Tools** — free, essential
- **Google Analytics 4** — already installed (`G-BGJBYZQXYL`)
- **Ahrefs Lite** ($29/mo) or **Moz Pro Starter** — optional but useful for backlink tracking
- **Manual SERP checks** — weekly incognito search for "clover digital" and screenshot position

---

## 9. Red Flags to Avoid

- ❌ **Buying links** or using link farms — will get you penalized
- ❌ **Keyword stuffing** beyond what's already on the site (we're at a good density)
- ❌ **Creating duplicate directory profiles with inconsistent NAP** — this actively hurts
- ❌ **Ignoring "Clover Digital LLC" vs "Clover Digital"** in citations — pick one canonical (recommended: "Clover Digital" for display, "Clover Digital LLC" for legal/registration fields only)
- ❌ **Deleting the `<div id="seo-content">` block** in `index.html` — it's what Googlebot reads on a React SPA
- ❌ **Changing the domain** — domain age compounds; stay on `cloverdigital.com`

---

## 10. Next Concrete Actions (this week)

Given you already verified GSC and installed GA4, the actual remaining work:

### ~20 minutes of clicks
1. [ ] **Bing Webmaster Tools** — https://www.bing.com/webmasters → add site → import verification from GSC → submit sitemap (5 min)
2. [ ] **Confirm sitemap submitted in GSC** if you haven't already (1 min)
3. [ ] **Request indexing in GSC** for `/` after today's schema changes propagate (2 min — do it tomorrow so Fastly has caught up)

### ~60 minutes of social claiming (do in one sitting)
4. [ ] LinkedIn Company Page at `/company/cloverdigital` (slug is free)
5. [ ] X `@cloverdigital` (verify availability first — handle-squatters are fast)
6. [ ] Crunchbase submit-organization form
7. [ ] Facebook/IG/YouTube/Threads/Bluesky handle-squat defense
8. [ ] Tell me the URLs of whatever you claim and I'll batch-update the `sameAs` array in JSON-LD + `llms-full.txt`

### 15 min of filming + ≤5 days Google-side
9. [ ] GBP video verification (prairie-fleet task `e71e1253`)

Claude Code can help (ask when ready):
- Drafting LinkedIn company description / X bio / Crunchbase listing from `llms-full.txt`
- Writing directory-submission copy templates with correct NAP
- Writing one blog post per week
- Drafting press pitch emails (rebrand angle)
- Writing the GBP long description (750+ chars, category-optimized)
- Drafting review-request email templates for pilot clients once they go live
- Batch-updating `sameAs` in schema + llms-full.txt once you have real URLs

---

## 11. File inventory (SEO-relevant files)

| File | Purpose |
|---|---|
| `index.html` | Homepage meta, all JSON-LD schemas, static SEO content for crawlers |
| `llms.txt` | Short AI-assistant reference (for AI crawlers that check well-known paths) |
| `llms-full.txt` | Full AI-assistant reference with disambiguation + founder + NAP |
| `sitemap.xml` | XML sitemap — 13 URLs |
| `robots.txt` | Crawl directives + hint toward llms.txt |
| `blog/*.html` | 7 blog posts, each with Article + BreadcrumbList schema |
| `for/*.html` | 4 industry landing pages (home-services, law-firms, real-estate, creative-agencies) |
| `BRAND.md` | Brand guidelines (voice, color, typography) — canonical source |
| `SEO_PLAYBOOK.md` | This file |

---

*Last updated: 2026-04-21 · Maintained by: Mason Cagnoni + Claude Code*
