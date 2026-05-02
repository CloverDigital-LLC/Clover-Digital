# Schema mapping — design ↔ live database

The Claude Design artifact was written against an idealized schema. Reality is
slightly different. This doc is the map.

**Source of truth:** `prairie-fleet` Supabase project (`projedxortxyafcsofhd`),
schema audited 2026-04-27.

---

## TL;DR

| Component | Live table | Adapter? | Notes |
|---|---|---|---|
| Command center | composed | `pickMasonFocus`, `pickAgentPush`, `buildWaitingItems`, `buildTrustSignals` | ADHD-aware first screen: Now, Next push, Waiting, Trust; combines tasks, commitments, proposals, heartbeats, and Archivist status |
| Pipeline | `cd_target_accounts` | `adaptCdAccount` | fit_score 0–100 → 1–5; `location_city` → `city`; `updated_at` → `last_touch_at` |
| Active work | `agent_tasks` | direct (filter) | venture in (prairie-digital, fleet) and not completed/cancelled/failed |
| Recently shipped | `agent_tasks` | direct (filter) | same ventures, `status = completed`, completed_at > 7d ago |
| Decisions & research | `knowledge` | `adaptKnowledge` | category in (decision, research, insight); project in (prairie-digital, fleet) |
| Open blockers | `agent_tasks` + `mason_commitments` | composite | blocked tasks + commitments where drift_days > 0 |
| Brand traction | (env vars + future GH/RSS APIs) | `useBrandTraction` | Manual entry for now |
| Cross-venture (admin) | `agent_tasks` | direct (filter) | venture NOT in (prairie-digital, fleet) |
| Personal commitments (admin) | `mason_commitments` | `adaptCommitment` | `commitment` → `title`; `due_date` → `target_date`; drift_days computed |
| Agent heartbeats (admin) | `agent_heartbeats` | `adaptHeartbeats` | latest row per agent; stale derived from age > 15min |
| Briefing | composed | `computeBriefing` | rolls up from tasks/commits/beats; `daily_briefs.full_brief` for narrative fallback |

All adapters live in `src/lib/adapters.ts`.

---

## Schema mismatches in detail

### Pipeline (`cd_target_accounts`)

The design's `pipeline` row has six fields:

```ts
{ business_name, vertical, city, score, status, last_touch_at }
```

Reality:

| Design field | Live column | Adapter behavior |
|---|---|---|
| `business_name` | `business_name` | direct |
| `vertical` | `vertical` | snake_case → Title Case (e.g. `home_services` → `Home Services`) |
| `city` | `location_city` + `location_state` | merged: "Springfield, IL" |
| `score` (1–5) | `fit_score` (0–~100) | banded: 80+ → 5, 60+ → 4, 40+ → 3, 20+ → 2, else 1 |
| `status` | `status` (new \| qualified \| disqualified) | direct — pill colors mapped in `StatusPill` |
| `last_touch_at` | `updated_at` | renamed |

The query also excludes `disqualified` so the pipeline doesn't show dead leads.

### Tasks (`agent_tasks`)

Direct fit. Two derived helpers:

- `isRunning(task)` — design's "running" pill = the task has `started_at` set and isn't yet completed/cancelled/failed/blocked. Live status enum is wider; we collapse it for the pill.
- `isInFlight(task)` — anything not `completed | cancelled | failed`.

### Commitments (`mason_commitments`)

| Design field | Live column |
|---|---|
| `title` | `commitment` |
| `target_date` | `due_date` |
| `drift_days` | computed from `(now - due_date)`, floor of days, clamped at 0 if not past or already closed |
| `owner` | `delegated_to ?? 'mason'` (commitments are Mason's by table convention) |

### Heartbeats (`agent_heartbeats`)

Live `status` enum is `idle | working | blocked`. Design uses `idle | busy | stale`.

| Design status | Source |
|---|---|
| `busy` | live `working` |
| `idle` | live `idle` |
| `stale` | computed: latest heartbeat age > 15min |
| `blocked` | live `blocked` (passed through; design treats it like stale) |

We pull the most recent heartbeat per agent from a 24h window and reduce.

### Briefing rollup

The design's `BriefingCard` had a hardcoded narrative + four bullet points. Live
version composes this from existing widget queries (no extra round-trip).

The narrative line:

1. If `daily_briefs.full_brief` has a row for today → use the first paragraph
2. Otherwise fall back to: "{n} tasks in flight, {m} shipped this week. {x} items need your eyes…"

The "Needs your attention" list is built dynamically from:
- blocked tasks (top one becomes the sub-text)
- drifted commitments (top by drift_days)
- replies-this-week count from `usePipelineKpis`
- stale agents

### Command center

The command center is the ADHD protocol surfaced as a dashboard contract, not a
new source of truth. It composes existing tables into four lanes:

- `Now` picks the highest-priority Mason-owned, critical, or blocked task, then
  falls back to the most urgent open or drifted commitment.
- `Next push` picks the highest-priority active non-Mason task or delegated
  commitment.
- `Waiting` combines blocked tasks, drifted commitments, stale or blocked
  heartbeats, and pending Archivist proposals.
- `Trust` checks latest Archivist status, pending proposal count, and stale or
  blocked agents.

Full reporting rules live in `FLEET_REPORTING_CONTRACT.md`.

---

## Things deliberately deferred

- **Goals widget** — design had a Goals card backed by a `goals` table that
  doesn't exist on prairie-fleet. v0.5 ships without it. v1 adds either:
  (a) a real `goals` + `goal_items` schema, or (b) a tagging convention on
  existing tasks/commitments. Open question for Mason.
- **Brand traction wiring** — Google rank is env-driven manual entry.
  Latest blog post should pull from `cloverdigital.com/rss.xml` (already
  exists). Latest GitHub commit should pull from the GitHub API for
  `cloverdigital-llc/Clover-Digital`. Both small follow-ups.
- **Drag-to-arrange layouts** — design had localStorage-backed reordering.
  Skipping for v0.5; the static grid is good. Re-add if cofounders want it.

---

## RLS — what we'll need before deploy

The dashboard uses the Supabase **anon** key, so all access goes through
Row Level Security. Tables we read from need `SELECT` policies.

Recommended approach: an `internal_users(email, role)` table where role is
`admin` or `team`. Then policies like:

```sql
-- Allow team members to read team-venture rows
CREATE POLICY "team can read team ventures" ON agent_tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM internal_users iu
            WHERE iu.email = auth.jwt() ->> 'email'
              AND iu.role IN ('admin', 'team'))
    AND venture IN ('prairie-digital', 'fleet')
  );

-- Admins can read everything
CREATE POLICY "admin can read all" ON agent_tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM internal_users iu
            WHERE iu.email = auth.jwt() ->> 'email'
              AND iu.role = 'admin')
  );
```

Mirror those for: `knowledge`, `mason_commitments` (admin-only),
`agent_heartbeats` (admin-only), `cd_target_accounts`, `daily_briefs`.

For v0.5 we can short-circuit by:
1. Setting `VITE_ADMIN_EMAILS` in `.env.local` for client-side role gating
2. Disabling RLS on the relevant tables temporarily, OR
3. Granting authenticated read on team-relevant tables only

Defer the proper RLS until first cofounder demo. Mason knows where it lives.
