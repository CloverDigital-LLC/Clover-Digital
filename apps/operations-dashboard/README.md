# Clover Digital — Operations Dashboard

Internal dashboard reading from the prairie-fleet Supabase blackboard plus the
Clover Ops Supabase business workspace.

The same codebase ships two deployment surfaces:

- **Clover Digital dashboard** (`VITE_DASHBOARD_SURFACE=clover`) — cofounder-facing,
  Clover-scoped, safe for Dan/Jasper/Shannon to use and help edit.
- **Mason admin dashboard** (`VITE_DASHBOARD_SURFACE=admin`) — separate Vercel
  project for aggregate fleet, personal, agent, and cross-venture views.

> **Status:** v0.6 — design ported from Claude Design, command center plus
> live-data widgets wired, magic-link auth scaffolded. RLS policies pending.

Live URL (target): `dashboard.cloverdigital.com`

---

## Quick start

```bash
git clone git@github.com:CloverDigital-LLC/Clover-Digital.git
cd Clover-Digital/apps/operations-dashboard
npm install
cp .env.example .env.local
# edit .env.local with your Supabase anon key + admin email list
npm run dev
```

Vite dev server starts on `http://localhost:5174`.

If you don't fill in env vars, the dashboard runs in **design mode** —
shows the layout with empty/loading states, no auth required. Useful
for demos and design iteration.

## Environment variables

```
VITE_SUPABASE_URL=https://projedxortxyafcsofhd.supabase.co
VITE_SUPABASE_ANON_KEY=<from Supabase project settings → API>
VITE_CLOVER_OPS_SUPABASE_URL=https://gfxpxkznqicbhbwlhply.supabase.co
VITE_CLOVER_OPS_SUPABASE_ANON_KEY=<from Clover Ops project settings → API>
VITE_DASHBOARD_SURFACE=clover                     # clover | admin
VITE_ADMIN_EMAILS=mason@cloverdigital.com         # comma-separated
VITE_BRAND_GOOGLE_RANK_TERM="clover digital"
VITE_BRAND_GOOGLE_RANK=                            # optional, manual
VITE_BRAND_GOOGLE_RANK_PREV=                       # optional, manual
```

`.env.local` is gitignored — never commit anon keys.

### Source Boundary

- `VITE_SUPABASE_*` points at prairie-fleet (`projedxortxyafcsofhd`): primary
  auth, dashboard role, fleet tasks, agent health, messages, sessions,
  commitments, Archivist proposals, and Mason's cross-venture view.
- `VITE_CLOVER_OPS_SUPABASE_*` points at Clover Ops (`gfxpxkznqicbhbwlhply`):
  Clover Digital business tasks/goals/knowledge, target accounts, artifacts,
  pipeline, and money signals.
- Clover Ops rows are prefixed inside the UI with `clover-ops:` so the detail
  drawer opens the right database. Human-facing Clover tickets still display
  their `CD-T-*` / `CD-G-*` keys in titles/details.
- If Clover Ops env is unset, the dashboard falls back to the existing
  prairie-fleet Clover tables so production does not break during rollout.
- `VITE_DASHBOARD_SURFACE=clover` forces the cofounder/team lens even when
  Mason signs in. `VITE_DASHBOARD_SURFACE=admin` enables Mason's aggregate
  `/projects`, `/agents`, personal, and cross-venture surfaces.

## Stack

- **React 19** + **Vite 8** + **TypeScript** — single-page app
- **Tailwind v4** — design tokens declared in `src/index.css` via `@theme`
- **@supabase/supabase-js** — auth + Postgrest queries across prairie-fleet
  and optional Clover Ops clients
- **@tanstack/react-query** — caching, refetch intervals, stale-while-revalidate

## Repository structure

| Path | Purpose |
|---|---|
| `src/App.tsx` | Top-level layout — sections + cards + admin gate |
| `src/main.tsx` | Entry — wires QueryClient + AuthProvider |
| `src/auth/` | Magic-link auth (`AuthProvider`, `SignIn`, role gating) |
| `src/components/atoms/` | `AgentPill`, `StatusPill`, `Card`, `Kpi`, `Score`, `EmptyState`, `CloverMark` |
| `src/components/cards/` | One file per widget |
| `src/components/Header.tsx` | Top nav + view toggle |
| `src/hooks/` | One file per query — `usePipeline`, `useTasks`, `useKnowledge`, etc. |
| `src/lib/supabase.ts` | Client singleton + configured flag |
| `src/lib/types.ts` | TypeScript types for live DB rows |
| `src/lib/adapters.ts` | DB row → design-shape adapters; tiny utilities |
| `src/index.css` | Tailwind import + brand tokens (`@theme`) + base styles |
| `SCHEMA_MAPPING.md` | Design ↔ live schema reconciliation |
| `FLEET_REPORTING_CONTRACT.md` | Reporting contract for agents, Archivist, and dashboard freshness |
| `FLEET_DASHBOARD_VIEWS.sql` | Optional read-only SQL views for tighter dashboard access |

## How auth works

- **Sign-in:** Supabase magic-link via `signInWithOtp`. PKCE flow.
- **Role:** `inferRole(email)` checks `VITE_ADMIN_EMAILS`. Returns `admin` or `team`.
- **Surface gate:** admin sections render only when the authenticated DB role is
  `admin` and the deployment is explicitly built with
  `VITE_DASHBOARD_SURFACE=admin`.
- **Server-side gating:** ⚠️ NOT YET. Add Supabase RLS policies before sharing
  with non-admins (see `SCHEMA_MAPPING.md` § RLS).

## How widget queries work

Every widget has its own hook in `src/hooks/`. Each hook:

1. Calls Supabase via the client in `src/lib/supabase.ts`
2. Filters / orders / limits at the SQL level (Postgrest)
3. Optionally runs through an adapter (`src/lib/adapters.ts`)
4. Returns typed data via React Query

Example wiring:

```ts
// src/hooks/usePipeline.ts
const { data, error } = await supabase
  .from('cd_target_accounts')
  .select('id, business_name, vertical, location_city, ...')
  .neq('status', 'disqualified')
  .order('fit_score', { ascending: false, nullsFirst: false })
  .limit(10)
return data.map(adaptCdAccount)   // → PipelineRow[]
```

## Adding a new widget

1. Pick the live table(s) it queries
2. Add row types to `src/lib/types.ts` (only if not already there)
3. Add an adapter in `src/lib/adapters.ts` if shape needs reshaping
4. Write the hook in `src/hooks/useFoo.ts`
5. Build the card in `src/components/cards/FooCard.tsx`
6. Drop the card into `src/App.tsx` in the right grid slot

## Tailwind brand tokens

All in `src/index.css` under `@theme`:

```css
--color-clover-50  through --color-clover-900   (sage → forest)
--color-cream-50   through --color-cream-300    (warm neutrals)
--color-ink-400    through --color-ink-900      (text)
--color-ochre-100/300/500   --color-rust-500    (accents)
--font-display: "Fraunces"
--font-sans: "Inter Tight"
```

Use Tailwind classes directly: `bg-clover-800 text-cream-50 font-display`.

## Deployment plan

1. Deploy the cofounder app to **Vercel** from the
   `CloverDigital-LLC/Clover-Digital` repo with root directory
   `apps/operations-dashboard` and
   `VITE_DASHBOARD_SURFACE=clover`.
2. Keep `clover-operations-dashboard` / `dashboard.cloverdigital.com` as the
   Clover Digital surface.
3. Deploy Mason's aggregate view as a separate Vercel project with
   `VITE_DASHBOARD_SURFACE=admin`.
4. Add env vars in both Vercel projects (mirror `.env.example`).
5. Add Supabase auth redirect URLs for both Vercel domains.
6. Apply RLS policies (see `SCHEMA_MAPPING.md`).
7. Invite Dan, Jasper, Shannon — magic-link sign-in.

## License

Proprietary. © 2026 Clover Digital LLC. All rights reserved.
