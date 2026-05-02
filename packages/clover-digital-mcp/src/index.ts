#!/usr/bin/env node
/**
 * Clover Digital MCP - company-owned operating tools.
 *
 * Authenticates through ~/.clover-digital/auth.json.
 * RLS at Clover Ops does the member/department gating; tool schemas
 * enforce shape (required department, source-prefixed keys, dup-check on create).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  handleCreateTask, handleListTasks, handleGetTask, handleUpdateTask,
  createTaskInput, listTasksInput, getTaskInput, updateTaskInput,
} from "./tools/tasks.js";
import {
  handleLogKnowledge, handleListKnowledge, handleGetKnowledge,
  logKnowledgeInput, listKnowledgeInput, getKnowledgeInput,
} from "./tools/knowledge.js";
import {
  handleListGoals, handleGetGoal,
  listGoalsInput, getGoalInput,
} from "./tools/goals.js";
import { getCurrentUser } from "./auth.js";

const server = new McpServer({
  name: "clover-digital",
  version: "0.1.0",
});

// Tasks
server.tool(
  "create_task",
  "Create a task on the Clover Digital board. REQUIRES department. Runs a duplicate-check on the title before creating; pass skip_dup_check=true if you've verified.",
  createTaskInput,
  handleCreateTask as any,
);

server.tool(
  "list_tasks",
  "List Clover Digital tasks. Use the `search` arg to verify a task doesn't already exist before creating.",
  listTasksInput,
  handleListTasks as any,
);

server.tool(
  "get_task",
  "Fetch one task by UUID or CD-T-* ticket key with full detail.",
  getTaskInput,
  handleGetTask as any,
);

server.tool(
  "update_task",
  "Patch a task: status, output (on completion), error (on block), priority, department. Auto-stamps started_at on running and completed_at on completed.",
  updateTaskInput,
  handleUpdateTask as any,
);

// Knowledge
server.tool(
  "log_knowledge",
  "Save a durable Clover Digital finding. Visibility is limited to internal/private. Aim for 'useful next month' content.",
  logKnowledgeInput,
  handleLogKnowledge as any,
);

server.tool(
  "list_knowledge",
  "Search knowledge by category and/or substring on title.",
  listKnowledgeInput,
  handleListKnowledge as any,
);

server.tool(
  "get_knowledge",
  "Fetch one knowledge entry by id.",
  getKnowledgeInput,
  handleGetKnowledge as any,
);

// Goals (read-only in v1)
server.tool(
  "list_goals",
  "List Clover Digital goals. Filter by department or status. Read-only in v1; goals are admin-managed.",
  listGoalsInput,
  handleListGoals as any,
);

server.tool(
  "get_goal",
  "Fetch one goal by UUID or CD-G-* public key with its linked tasks. Read-only in v1.",
  getGoalInput,
  handleGetGoal as any,
);

// Boot
async function main(): Promise<void> {
  // Verify auth before exposing tools; fail loud if the user doesn't have
  // a valid session, rather than letting the first tool call return a
  // confusing error.
  try {
    const me = await getCurrentUser();
    if (!me.email || !me.role) {
      process.stderr.write(
        "ERROR: Clover Digital MCP authenticated but the user isn't on " +
          "the cd_members allowlist in Clover Ops. Ask a Clover admin to add you.\n",
      );
      process.exit(1);
    }
    process.stderr.write(
      `Clover Digital MCP starting as ${me.email} (role=${me.role})\n`,
    );
  } catch (err) {
    process.stderr.write(`ERROR: ${(err as Error).message}\n`);
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Clover Digital MCP fatal: ${err}\n`);
  process.exit(1);
});
