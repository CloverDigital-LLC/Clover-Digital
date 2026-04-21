# Clover Digital — Brand Guidelines

**Version 0.1 · April 2026**
**Canonical source:** [github.com/Masoncags-tech/Clover-Digital/blob/main/BRAND.md](https://github.com/Masoncags-tech/Clover-Digital/blob/main/BRAND.md)

Design tokens live in [`src/index.css`](src/index.css) `:root`. If anything below ever conflicts with the code, the code wins — update this doc.

---

## 1. Identity

**Clover Digital LLC** builds and deploys custom-trained digital employees for small and mid-sized businesses across the Midwest United States. We are a managed service, not a software platform. The client hires an employee, not a tool.

**Positioning in one sentence:** *A new kind of workforce, grounded in the heartland.*

**We are:**
- A service company, not software
- Custom-built per business, not one-size-fits-all
- Human-managed, AI-powered
- Flat-fee, no usage tiers
- Main Street focused

**We are not:**
- A chatbot
- A SaaS platform with dashboards
- An offshore VA agency
- Enterprise-flavored

---

## 2. Voice & Tone

**Aesthetic:** warm, grounded, editorial. Anti-tech-bro.

**Sound like:** a capable shop manager who writes well. Confident without swagger. Specific over fluffy. Direct without being curt.

**Do**
- Use short sentences. Use commas instead of em-dashes where possible.
- Lead with the concrete: "schedules," "invoices," "follow-ups" — not "operational excellence."
- Talk like a person. Contractions are fine.
- Trust the reader. Don't over-explain the obvious.
- Use italicized phrases for moments of emphasis ("*doesn't sleep.*"), not exclamation points.

**Don't**
- Say "revolutionary," "cutting-edge," "next-gen," "disruptive," "synergy," "leverage."
- Use emoji in long-form copy (occasional in short messages = fine).
- Pile up adjectives — pick one good one.
- Write like a SaaS landing page circa 2019.
- Capitalize every word of a CTA ("Get Started" → "Get started" or "Book a call").

**Reference lines that feel right**
- "Your new best employee *doesn't sleep.*"
- "Grounded in reality. Built for Main Street."
- "One text. Done by end of day."
- "Simple to hire. Easier to manage."
- "Reliable digital employees for small businesses across the heartland."

---

## 3. Color

All tokens are in `src/index.css` `:root`. Use the CSS vars, not raw hex, in site code.

### Greens — the Clover family
| Token | Hex | Use |
|---|---|---|
| `--green-900` | `#0f2a1d` | Darkest; footer background, tree canopy shadows, headline ink in dark contexts |
| `--green-800` | `#153a28` | Dark sections (Capabilities, CTA) |
| `--green-700` | `#1f4d35` | Primary brand green. Logo mark, headings, nav CTA |
| `--green-600` | `#2f6b4a` | Secondary emphasis; mid-hill gradient |
| `--green-500` | `#4a8b67` | "Clover" wordmark, focus rings, hill highlights |
| `--green-400` | `#6a9a7a` | Interpolation mid-tone |
| `--green-300` | `#a7c4b2` | Light green; footer links, distant foliage |
| `--green-200` | `#c5d8cb` | Input borders, dividers |
| `--green-100` | `#e3ede5` | Soft backgrounds, avatars |
| `--green-50`  | `#f1f5f1` | Barely-there tint |

### Warm neutrals
| Token | Hex | Use |
|---|---|---|
| `--cream`  | `#faf6ef` | Body background, card surfaces |
| `--white`  | `#ffffff` | Pure white — reserved for headline emphasis on blue hero, iMessage bubbles |

### Accent — Ochre (replaces old gold)
| Token | Hex | Use |
|---|---|---|
| `--gold`       | `#c98b3a` | Primary CTA button |
| `--gold-light` | `#e3a97a` | Soft accent, glows |
| `--gold-dark`  | `#a0681f` | CTA hover / pressed |

### Ink (text)
| Token | Hex | Use |
|---|---|---|
| `--text-primary`   | `#1a1a16` | Body copy, headings on light backgrounds |
| `--text-secondary` | `#3a3a32` | Secondary text |
| `--text-muted`     | `#6b6b5f` | Meta, captions |

**Contrast rules**
- Never place `--text-muted` on `--cream` below 14px (fails WCAG AA)
- Ochre on white is fine at 16px+ bold; use `--green-900` for small ochre-accent text

---

## 4. Typography

Two typefaces, both free from Google Fonts.

### Fraunces — display (serif)
- Used for: H1, H2, H3, hero emphasis, testimonial quotes, modal titles
- Weight range: 300–700 (variable). Default heading weight: 400.
- Hero emphasis (`<em>` inside H1): weight 600, italic.
- Good for editorial headlines, pull quotes, the italic "Clover Digital" wordmark.

### Inter Tight — sans (body)
- Used for: body text, UI, buttons, nav, form inputs
- Weight range: 300–700.
- Default body weight: 400. Buttons: 600. Eyebrow/labels: 500 uppercase.

### Scale (mobile-first clamp values from `index.css`)
- H1: `clamp(2.5rem, 5vw, 3.75rem)`, `letter-spacing: -0.03em`
- H2: `clamp(1.875rem, 3.5vw, 2.75rem)`
- H3: `clamp(1.125rem, 2vw, 1.375rem)`
- Body: `16px`, `line-height: 1.6`
- Hero sub: `clamp(1.0625rem, 2vw, 1.1875rem)`, `line-height: 1.7`

### Imports (Google Fonts)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Inter+Tight:ital,wght@0,300..700;1,300..700&display=swap">
```

---

## 5. Logo

### Primary mark — "Stem"
Four overlapping ellipses in a 2×2 grid forming a clover leaf, plus a small curved stem. Center dot (cream or white on the dark-green version) for definition at larger sizes.

**Downloads (self-hosted, always fresh):**
- **Full logo (wordmark + mark)** — https://cloverdigital.com/logo.png (512×512 PNG, cream bg)
- **Icon / favicon SVG** — https://cloverdigital.com/favicon.svg (scalable)
- **Icon PNGs** — https://cloverdigital.com/favicon-32.png · https://cloverdigital.com/favicon-192.png · https://cloverdigital.com/favicon-512.png
- **Apple touch icon** — https://cloverdigital.com/apple-touch-icon.png (180×180)
- **Social / OG card** — https://cloverdigital.com/og-image.png (1200×630)

**Minimum sizes**
- Mark-only: 24px minimum. Below that, center dot and stem disappear — use the rounded-square favicon tile instead.
- Wordmark: 16px tall minimum for "Clover Digital" text. Below, drop the wordmark and show the mark only.

**Clear space**
- Always leave at least 1× the mark's height as padding around it.

**Don'ts**
- Don't recolor — use only `--green-700` (dark-bg: `--green-300`), never blue or multi-color.
- Don't skew, stretch, or outline.
- Don't add drop shadows to the mark itself (drop-shadows are fine on the clover *clouds* — those are a different motif).
- Don't use on busy photographs.

---

## 6. Clover motif

The four-circle clover shape is the signature visual element. It appears in:

1. **Logo mark** — primary identifier
2. **Hero clouds** — white 4-circle clovers drifting in the sky, slightly rotated (-7° to -15°) to read as wind
3. **Hero trees** — same 4-circle canopy on a narrow trunk, axis-aligned
4. **Favicon + OG card** — distilled marks

**Rule of thumb:** use the clover as a motif, not a pattern. Restraint wins. The homepage uses it in ~3 places total (logo, clouds, trees). A deck or document should use it 1–3 times max.

### Do
- Let the clover shape be the rhythm
- Use axis-aligned clovers for objects "on the ground" (trees, logo, icons)
- Use slightly rotated clovers for objects "in motion" (drifting clouds)

### Don't
- Fill a background with clover pattern
- Use clover shape to replace every O, I, or vowel (we tried "o as clover" — it was too much)
- Mix the clover shape with other overtly-cute shapes (stars, hearts, emoji)

---

## 7. Imagery & illustration

We do not use stock photography. The site is illustrated with flat SVG:

- XP-style blue sky gradient (`#C8DFEE` → `#B0D0E4` → `#A3C5D8` → `--cream`)
- Rolling green hills (3-layer gradient, clover greens)
- White clover clouds, drifting
- Clover trees on the hills, atmospheric (nearer = darker + more opaque)

**If you need photography later:** warm natural light, midwest small-business setting, real people working (not stock-looking). Crop tight. Slight warm tone (not blue).

---

## 8. Copy cheat sheet

### Subject lines / headlines
- "Your new best employee *doesn't sleep.*"
- "One text. Done by end of day."
- "Simple to hire. Easier to manage."
- "Main Street, upgraded."

### CTAs (sentence case, action-first)
- Primary: "Meet your new hire →" / "Book a discovery call →"
- Secondary: "See how it works"
- Form submit: "Book my call"

### Email signatures
```
— [Name], Clover Digital
hello@cloverdigital.com · (217) 303-4601
Digital employees for small business · Springfield, IL
```

### How to talk about the product
- "A digital employee" (not "an AI agent," not "our platform")
- "Your digital employee" (possessive — emphasize ownership)
- "Hire" (verb, like hiring a person — not "deploy," "integrate," "onboard")
- "They" (pronoun — treat the digital employee as a team member)

---

## 9. File locations

| Asset | Location |
|---|---|
| This brand guide | `~/clover-digital-site/BRAND.md` (this file) + Notion mirror |
| Color tokens (source of truth) | `~/clover-digital-site/src/index.css` `:root` |
| Meta / JSON-LD | `~/clover-digital-site/index.html` |
| AI-facing copy | `~/clover-digital-site/llms.txt` + `llms-full.txt` |
| Logo PNGs | `~/clover-digital-site/logo.png`, `favicon.svg`, `favicon-*.png`, `og-image.png` |
| Icon generator script | `~/clover-digital-site/scripts/generate-icons.mjs` |
| OG card generator | `~/clover-digital-site/scripts/generate-og.mjs` |
| Original design bundle | `~/clover-digital/` (Claude Design export, reference only) |

---

*Last updated: 2026-04-21 · Maintained by: Clover Digital team*
