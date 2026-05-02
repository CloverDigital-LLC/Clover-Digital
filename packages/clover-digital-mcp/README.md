# Clover Digital MCP

Company-owned MCP server for Clover Ops.

This package lets Clover Digital teammates and their AI agents work with the
Clover Ops Supabase project through a small, safe tool surface:

- tasks in `cd_tasks`
- goals in `cd_goals`
- durable notes in `cd_knowledge`

The MCP connects only to Clover Ops Supabase. It only accepts Clover public
keys (`CD-T-*` tasks and `CD-G-*` goals) or UUIDs from the same Clover Ops
database.

## Requirements

- Node.js 20+
- a Clover Digital email account
- an active `cd_members` row in Clover Ops
- Supabase Auth redirect allowlisted:

```text
http://127.0.0.1:8787/callback
```

## Install

```bash
git clone git@github.com:CloverDigital-LLC/Clover-Digital.git
cd Clover-Digital/packages/clover-digital-mcp
npm install
npm run build
```

## Sign In

```bash
npm run setup -- --email <your-clover-email>
```

The setup command starts a local callback server, sends a magic link, and
saves tokens to `~/.clover-digital/auth.json` after the browser lands back on
the local callback URL.

If the normal callback flow is blocked, use one of the fallback modes with a
fresh magic link:

```bash
npm run setup -- --link "<fresh-full-magic-link-url>"
npm run setup -- --paste
```

Tokens are stored at `~/.clover-digital/auth.json` with owner-only file
permissions.

## Wire Into Claude Code

Add this MCP server to the agent's MCP config:

```json
{
  "mcpServers": {
    "clover-digital": {
      "command": "node",
      "args": ["/absolute/path/to/Clover-Digital/packages/clover-digital-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Code after changing the config or refreshing auth. Tools should
appear as `mcp__clover-digital__*`.

## Wire Into Codex

Add this to `~/.codex/config.toml`:

```toml
[mcp_servers.clover-digital]
command = "node"
args = ["/absolute/path/to/Clover-Digital/packages/clover-digital-mcp/dist/index.js"]
```

Restart Codex after changing the config or refreshing auth.

## Tools

| Tool | What it does |
|---|---|
| `create_task` | Create a Clover Digital task. Requires `department`; runs duplicate checks before writing. |
| `list_tasks` | Search and filter tasks. Use `search` before creating similar work. |
| `get_task` | Fetch one task by UUID or `CD-T-*` key. |
| `update_task` | Patch status, output, error, priority, or department. |
| `log_knowledge` | Save a durable Clover Digital finding. |
| `list_knowledge` | Search knowledge by category and/or title substring. |
| `get_knowledge` | Fetch one knowledge entry. |
| `list_goals` | Read Clover Digital goals; filter by department/status. |
| `get_goal` | Fetch one goal by UUID or `CD-G-*` key with linked tasks. |

## Guardrails

- Use only Clover Ops UUIDs, `CD-T-*`, and `CD-G-*` keys.
- Every task must have a department: `product-eng`, `marketing`, `sales`, or `ops`.
- The MCP checks for possible duplicate open tasks before creating a new one.
- Goals are read-only in v1; create linked tasks or ask a Clover admin to edit goals.
- Knowledge visibility is `venture` or `private`.
- If a workflow is outside Clover Ops, stop and ask a Clover admin where it belongs.

## Token Lifecycle

- Access tokens last about 1 hour; refresh tokens are long-lived.
- The MCP auto-refreshes access tokens behind a local file lock so multiple
  local agent processes do not race the same refresh token.
- If auth refresh fails, the MCP fails loud instead of silently falling back to
  anonymous reads.
- If refresh fails because the token was revoked or the member was removed,
  rerun setup.

## Smoke Test

Run after auth setup and after any RLS/tool changes:

```bash
npm run build
npm run smoke
```

The default smoke goal is `CD-G-000001`. To target another Clover Ops goal:

```bash
CD_SMOKE_GOAL_ID=CD-G-000002 npm run smoke
```

The smoke test verifies:

- auth initializes as a Clover Ops member
- all v1 tools are exposed
- goals are visible through `list_goals` and `get_goal`
- `create_task` can link `goal_id`
- duplicate checks reject a duplicate open task
- `update_task` can cancel the smoke task
- `log_knowledge`, `get_knowledge`, and `list_knowledge` work

## Troubleshooting

**"No auth file at ~/.clover-digital/auth.json"** - run setup again.

**"Redirect URL not allowed"** - ask a Clover admin to add
`http://127.0.0.1:8787/callback` to Supabase Auth Redirect URLs for Clover Ops,
then rerun setup. If you cannot use the callback flow, copy a fresh full magic
link URL and use `npm run setup -- --link`.

**"Invalid Refresh Token: Already Used"** - another local MCP process or smoke
test consumed the refresh token first. Rerun setup, then restart every agent
process so they all load the new token pair.

**"authenticated but the user isn't on the cd_members allowlist"** - the
member row is missing or inactive. Ask a Clover admin to restore access.

**Tools return zero rows even though the dashboard has data** - the runtime is
probably stale or unauthenticated. Rerun setup, restart the MCP client, and run
the smoke test.

**"Possible duplicate(s) detected"** on `create_task` - search the existing
matches; update one of them or pass `skip_dup_check=true` only if the work is
genuinely separate.
