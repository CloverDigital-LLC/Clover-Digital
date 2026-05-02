# Fleet Reporting Contract

This is the shared shape for the Clover dashboard and the prairie-fleet agents.
The point is simple: keep Mason's view current, small, and trustworthy without
making him manage the system by hand.

## Guardrails Protocol

- Zero-friction capture: agents log work where it already belongs.
- Automatic structure: dashboards and briefs turn raw rows into decisions.
- Guardrails, not gates: the system nudges, routes, and proposes. It does not
  block Mason from moving.
- Fill gaps while Mason sleeps: Archivist consolidates, dedupes, and surfaces
  stale work overnight.
- Every surfaced item needs an action: inspect, unblock, approve, delegate, or
  ignore.
- The adaptive operating contract lives at
  `/Users/mason/prairie/guardrails/MASON-ADAPTIVE-PROTOCOL.md`.

The first screen must answer four questions:

| Lane | Purpose | Source |
| --- | --- | --- |
| Now | One thing Mason should look at first. | Critical, blocked, or Mason-owned `agent_tasks`; drifted/open `mason_commitments`. |
| Next push | One agent task or delegated commitment that deserves a nudge. | Active non-Mason `agent_tasks`; non-Mason `mason_commitments`. |
| Waiting | Blockers, drift, stale agents, and pending proposals. | `agent_tasks`, `mason_commitments`, `agent_heartbeats`, `memory_proposals`. |
| Trust | Whether the board can be trusted right now. | Latest Archivist status, pending proposal count, heartbeat freshness. |

## Blackboard Tables

| Table | Owner | Required behavior |
| --- | --- | --- |
| `agent_tasks` | Every agent via fleet MCP | Keep `status`, `priority`, `agent`/`assigned_to`, `output`, and `error` current. No raw SQL writes. |
| `agent_heartbeats` | Agent runtimes and monitors | Emit current status often enough that stale means something. Dashboard marks stale after 15 minutes. |
| `mason_commitments` | Codex, Claude Code, Hermes | Track promises Mason made, including `due_date`, `delegated_to`, and drift. |
| `knowledge` | Agents via fleet MCP | Store durable decisions, references, and status summaries. Archivist scheduled summaries use `source_agent='archivist'`, `project='fleet'`, `category='status'`. |
| `memory_proposals` | Archivist | Pending proposals only until approved. No automatic board rewrites during Stage 2. |
| `daily_briefs` | Briefing automation | One compact daily brief with action items. Keep it short enough to scan. |

## Freshness Rules

| Signal | Good | Needs attention |
| --- | --- | --- |
| Dashboard queries | 30 second refresh | Query errors or missing auth policies. |
| Agent heartbeat | Latest row under 15 minutes old | Any stale or blocked agent. |
| Archivist | Latest status under 30 hours old | No run, failed run, or stale run. |
| Archivist coverage | Latest summary has `skipped_sources=none` | Fresh but partial run with skipped sources. |
| Memory proposals | 0 to 10 pending | More than 10 pending or unreviewed for multiple days. |
| Commitments | No open item past due | Any `open` or `in_progress` item past `due_date`. |
| Tasks | Blocked work has an owner and an error note | Blocked without useful error, or running without updates. |

## Write Rules

- The dashboard is read-only for fleet blackboard data in this phase.
- Agents write through the fleet MCP only.
- Claude Code and Codex are Command Deck sessions and should not be SSH-dispatched.
- Archivist may create pending proposals and status knowledge. It may not auto-apply
  task status changes until explicitly promoted.
- Secrets and private payloads stay out of dashboard rows. Store credentials in
  1Password, then reference the integration or item name when needed.

## Agent Report Shape

Every agent status update should be digestible into this shape:

```text
Agent:
State: idle | working | blocked | offline
Task:
Changed:
Need:
Next:
Confidence:
```

Rules:

- `Changed` is what moved since the last update.
- `Need` is empty unless Mason or another agent can unblock it.
- `Next` is the next concrete action, not a vibe.
- `Confidence` is high, medium, or low. Low confidence should create a blocker or
  research task, not linger in chat.

## Dashboard View Policy

The app can read raw tables today, but stable SQL views are preferred before
cofounder or client-facing use. Views should be additive, read-only, and named
with a `dashboard_` prefix so RLS can grant narrow `SELECT` access without
exposing private payloads.
