#!/usr/bin/env node
/**
 * End-to-end smoke test for the Clover Digital MCP.
 * Spawns the server as a child process, talks JSON-RPC over stdio, and
 * exercises the full v1 surface, including the epic-linked task path that
 * the dashboard depends on.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER = join(__dirname, "dist", "index.js");
const SMOKE_GOAL_ID =
  process.env.CD_SMOKE_GOAL_ID ?? "CD-G-000001";
const REQUIRED_TOOLS = [
  "create_task",
  "list_tasks",
  "get_task",
  "update_task",
  "log_knowledge",
  "list_knowledge",
  "get_knowledge",
  "list_goals",
  "get_goal",
];

const proc = spawn("node", [SERVER], {
  stdio: ["pipe", "pipe", "inherit"],
});

let buf = "";
const pending = new Map();
let nextId = 1;

proc.stdout.on("data", (chunk) => {
  buf += chunk.toString();
  let nl;
  while ((nl = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, nl);
    buf = buf.slice(nl + 1);
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id != null && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    } catch (e) {
      console.error("(non-json):", line);
    }
  }
});

function send(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, (msg) =>
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result),
    );
    proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  });
}

function sendNotification(method, params = {}) {
  proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
}

async function callTool(name, args = {}) {
  const result = await send("tools/call", {
    name,
    arguments: args,
  });
  if (result.isError) {
    throw new Error(`${name} failed: ${result.content?.[0]?.text ?? "unknown error"}`);
  }
  return JSON.parse(result.content[0].text);
}

async function callToolExpectError(name, args = {}) {
  const result = await send("tools/call", {
    name,
    arguments: args,
  });
  if (!result.isError) throw new Error(`${name} unexpectedly succeeded`);
  return result.content?.[0]?.text ?? "";
}

async function main() {
  console.log("→ initialize");
  const init = await send("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "smoke-test", version: "0.0.1" },
  });
  console.log("  server:", init.serverInfo);
  sendNotification("notifications/initialized");

  console.log("→ tools/list");
  const tools = await send("tools/list");
  const toolNames = tools.tools.map((t) => t.name);
  console.log("  tools:", toolNames.join(", "));
  const missing = REQUIRED_TOOLS.filter((name) => !toolNames.includes(name));
  if (missing.length > 0) {
    throw new Error(`missing required tools: ${missing.join(", ")}`);
  }

  console.log("→ tools/call list_tasks (limit=3)");
  const listed = await callTool("list_tasks", { limit: 3 });
  console.log(`  count: ${listed.count}`);
  console.log(`  first: ${listed.tasks?.[0]?.title?.slice(0, 60)}…`);

  console.log(`→ tools/call get_goal (${SMOKE_GOAL_ID})`);
  const goalPayload = await callTool("get_goal", { id: SMOKE_GOAL_ID });
  console.log(`  ✓ goal: ${goalPayload.goal.title}`);

  console.log("→ tools/call list_goals (goal department)");
  const goals = await callTool("list_goals", {
    department: goalPayload.goal.department,
    include_closed: true,
  });
  if (
    !goals.goals?.some(
      (goal) => goal.id === goalPayload.goal.id || goal.public_key === SMOKE_GOAL_ID,
    )
  ) {
    throw new Error("list_goals did not include the smoke goal");
  }
  console.log(`  ✓ listed ${goals.count} ${goalPayload.goal.department} goal(s)`);

  console.log("→ tools/call create_task (goal-linked smoke)");
  const uniqTag = `smokeverify${Date.now()}`;
  const taskTitle = `Smoke ${uniqTag} Clover MCP write path`;
  const newTask = await callTool("create_task", {
    title: taskTitle,
    description:
      "End-to-end verification that the Clover Digital MCP can write through " +
      "JWT auth + RLS and link a task to a goal. Created by smoke-test.mjs.",
    department: "product-eng",
    priority: "low",
    goal_id: SMOKE_GOAL_ID,
  });
  console.log(`  ✓ created: ${newTask.ticket_key ?? newTask.id}`);
  if (!newTask.ticket_key?.startsWith("CD-T-")) {
    throw new Error("created task did not receive a CD-T-* ticket key");
  }
  if (newTask.goal_id !== goalPayload.goal.id) {
    throw new Error("created task did not preserve goal_id");
  }

  console.log("→ tools/call get_task (created task by CD-T key)");
  const fetchedTask = await callTool("get_task", { id: newTask.ticket_key });
  if (fetchedTask.id !== newTask.id || fetchedTask.goal_id !== goalPayload.goal.id) {
    throw new Error("get_task did not return the goal-linked smoke task");
  }
  console.log("  ✓ fetched task with goal_id");

  console.log("→ tools/call create_task (expect dup-check rejection while original is still queued)");
  await callToolExpectError("create_task", {
    title: taskTitle,
    description: "Same title as above; should be rejected by dup-check.",
    department: "product-eng",
  });
  console.log("  ✓ dup-check rejected (as expected)");

  console.log("→ tools/call update_task (mark cancelled to clean up)");
  const upd = await callTool("update_task", {
    id: newTask.ticket_key,
    status: "cancelled",
    output: "Smoke test artifact, dropped after verification.",
  });
  console.log(`  ✓ status now: ${upd.status}`);

  console.log("→ tools/call log_knowledge (smoke)");
  const knowledgeTitle = `Smoke ${uniqTag} Clover MCP knowledge path`;
  const knowledge = await callTool("log_knowledge", {
    title: knowledgeTitle,
    content:
      "Smoke-test artifact verifying the Clover Digital MCP knowledge write/read path.",
    category: "status",
    scope: "venture",
    is_private: false,
    tags: ["smoke-test", "clover-mcp"],
  });
  console.log(`  ✓ logged knowledge: ${knowledge.id}`);

  console.log("→ tools/call get_knowledge");
  const fetchedKnowledge = await callTool("get_knowledge", { id: knowledge.id });
  if (fetchedKnowledge.id !== knowledge.id) {
    throw new Error("get_knowledge did not return the smoke knowledge row");
  }
  console.log("  ✓ fetched knowledge row");

  console.log("→ tools/call list_knowledge (search smoke title)");
  const knowledgeList = await callTool("list_knowledge", {
    search: knowledgeTitle,
    limit: 5,
  });
  if (!knowledgeList.items?.some((item) => item.id === knowledge.id)) {
    throw new Error("list_knowledge did not include the smoke knowledge row");
  }
  console.log("  ✓ list_knowledge found row");

  console.log("\n✅ ALL CHECKS PASSED");
  proc.kill();
  process.exit(0);
}

proc.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error("server exited with code", code);
    process.exit(1);
  }
});

main().catch((err) => {
  console.error("smoke test failed:", err);
  proc.kill();
  process.exit(1);
});
