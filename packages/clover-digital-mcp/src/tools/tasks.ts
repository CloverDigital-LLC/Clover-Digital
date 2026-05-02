import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getClient } from "../auth.js";
import {
  zStatus, zPriority, zDepartment,
  Department,
} from "../enums.js";

// Schemas

export const createTaskInput = {
  title: z.string().min(1).max(200).describe(
    "Short human-readable task title.",
  ),
  description: z.string().min(1).describe(
    "Full task details: context, scope, what success looks like.",
  ),
  department: zDepartment.describe(
    "REQUIRED. Sales / marketing / product-eng / ops. Pick the one that " +
    "matches what this work is moving (money in = sales; brand = marketing; " +
    "code/deploy = product-eng; coordination/finance/legal = ops).",
  ),
  priority: zPriority.default("normal").describe(
    "critical / high / normal / low. Default normal.",
  ),
  acceptance_criteria: z.string().optional().describe(
    "Objective conditions for 'done'. Recommended for anything nontrivial.",
  ),
  parent_task_id: z.string().uuid().optional().describe(
    "Link to a parent task for fix cycles / handoff chains.",
  ),
  goal_id: z.string().min(1).optional().describe(
    "Link to a goal this task directly advances. Accepts UUID or CD-G-*.",
  ),
  skip_dup_check: z.boolean().default(false).describe(
    "Disable the search-before-create dup check. Only set true if you've " +
    "already verified an existing similar task isn't this work.",
  ),
};

export const listTasksInput = {
  status: zStatus.optional(),
  department: zDepartment.optional(),
  priority: zPriority.optional(),
  limit: z.number().int().min(1).max(100).default(30),
  search: z.string().optional().describe(
    "Substring match on title (case-insensitive). Use this to verify a " +
    "task doesn't already exist before creating.",
  ),
};

export const getTaskInput = {
  id: z.string().min(1).describe("Task UUID or CD-T-* ticket key."),
};

export const updateTaskInput = {
  id: z.string().min(1).describe("Task UUID or CD-T-* ticket key."),
  status: zStatus.optional(),
  output: z.string().optional().describe(
    "Completion summary. Set alongside status='completed'.",
  ),
  error: z.string().optional().describe(
    "Blocker reason. Set alongside status='blocked'.",
  ),
  priority: zPriority.optional(),
  department: zDepartment.optional().describe(
    "Reclassify the Clover Digital department.",
  ),
};

// Helpers

function toContent(value: unknown) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(value, null, 2) },
    ],
  };
}

function toError(msg: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: `ERROR: ${msg}` }],
  };
}

const TASK_SELECT =
  "id, ticket_key, title, description, status, department, " +
  "priority, parent_task_id, goal_id, output, error, source_system, source_ref, " +
  "started_at, completed_at, created_at, updated_at, requested_by, acceptance_criteria";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Lookup = { column: "id" | "ticket_key"; value: string };

function resolveTaskLookup(raw: string): Lookup | string {
  const value = raw.trim();
  const upper = value.toUpperCase();
  if (upper.startsWith("CD-T-")) return { column: "ticket_key", value: upper };
  if (UUID_RE.test(value)) return { column: "id", value };
  return "This MCP only accepts Clover task UUIDs or CD-T-* ticket keys.";
}

async function resolveGoalId(
  client: SupabaseClient,
  raw?: string,
): Promise<{ id: string | null } | { error: string }> {
  if (!raw) return { id: null };
  const value = raw.trim();
  const upper = value.toUpperCase();
  if (UUID_RE.test(value)) return { id: value };
  if (!upper.startsWith("CD-G-")) {
    return { error: "This MCP only accepts Clover goal UUIDs or CD-G-* public keys." };
  }

  const { data, error } = await client
    .from("cd_goals")
    .select("id")
    .eq("public_key", upper)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data?.id) return { error: `No goal ${upper} visible to you.` };
  return { id: data.id as string };
}

// Handlers

export async function handleCreateTask(args: {
  title: string;
  description: string;
  department: Department;
  priority?: "critical" | "high" | "normal" | "low";
  acceptance_criteria?: string;
  parent_task_id?: string;
  goal_id?: string;
  skip_dup_check?: boolean;
}) {
  const client = await getClient();
  const resolvedGoal = await resolveGoalId(client, args.goal_id);
  if ("error" in resolvedGoal) return toError(resolvedGoal.error);

  // Search-before-create. Substring match on title against open tasks.
  // Duplicates are the highest-cost mistake on the board.
  if (!args.skip_dup_check) {
    const titleWords = args.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4);
    if (titleWords.length > 0) {
      // Use the longest content word as a coarse match signal.
      const probe = titleWords.sort((a, b) => b.length - a.length)[0];
      if (!probe) return toError("Could not derive a duplicate-check probe from title.");
      const { data: dups } = await client
        .from("cd_tasks")
        .select("id, ticket_key, title, status")
        .ilike("title", `%${probe}%`)
        .not("status", "in", "(completed,cancelled,failed)")
        .limit(5);
      if (dups && dups.length > 0) {
        return toError(
          `Possible duplicate(s) detected. Pass skip_dup_check=true to ` +
            `create anyway, or update the existing one.\n\n` +
            `Existing matches:\n${dups
              .map((d) => `- ${d.ticket_key ?? d.id} (${d.status}): ${d.title}`)
              .join("\n")}`,
        );
      }
    }
  }

  const row = {
    title: args.title,
    description: args.description,
    department: args.department,
    priority: args.priority ?? "normal",
    status: "queued" as const,
    parent_task_id: args.parent_task_id ?? null,
    goal_id: resolvedGoal.id,
    acceptance_criteria: args.acceptance_criteria ?? null,
    source_system: "clover-mcp",
  };

  const { data, error } = await client
    .from("cd_tasks")
    .insert(row)
    .select(TASK_SELECT)
    .single();

  if (error) return toError(error.message);
  return toContent(data);
}

export async function handleListTasks(args: {
  status?: string;
  department?: Department;
  priority?: string;
  limit?: number;
  search?: string;
}) {
  const client = await getClient();
  let q = client
    .from("cd_tasks")
    .select(TASK_SELECT)
    .order("priority", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(args.limit ?? 30);
  if (args.status) q = q.eq("status", args.status);
  if (args.department) q = q.eq("department", args.department);
  if (args.priority) q = q.eq("priority", args.priority);
  if (args.search) q = q.ilike("title", `%${args.search}%`);
  const { data, error } = await q;
  if (error) return toError(error.message);
  return toContent({ count: data?.length ?? 0, tasks: data });
}

export async function handleGetTask(args: { id: string }) {
  const client = await getClient();
  const lookup = resolveTaskLookup(args.id);
  if (typeof lookup === "string") return toError(lookup);
  const { data, error } = await client
    .from("cd_tasks")
    .select(TASK_SELECT)
    .eq(lookup.column, lookup.value)
    .maybeSingle();
  if (error) return toError(error.message);
  if (!data) return toError(`No task ${args.id} visible to you.`);
  return toContent(data);
}

export async function handleUpdateTask(args: {
  id: string;
  status?: string;
  output?: string;
  error?: string;
  priority?: string;
  department?: Department;
}) {
  const client = await getClient();
  const lookup = resolveTaskLookup(args.id);
  if (typeof lookup === "string") return toError(lookup);
  const patch: Record<string, unknown> = {};
  if (args.status !== undefined) patch.status = args.status;
  if (args.output !== undefined) patch.output = args.output;
  if (args.error !== undefined) patch.error = args.error;
  if (args.priority !== undefined) patch.priority = args.priority;
  if (args.department !== undefined) patch.department = args.department;
  if (args.status === "running") patch.started_at = new Date().toISOString();
  if (args.status === "completed")
    patch.completed_at = new Date().toISOString();
  if (Object.keys(patch).length === 0)
    return toError("update must include status / output / error / priority / department");

  const { data, error } = await client
    .from("cd_tasks")
    .update(patch)
    .eq(lookup.column, lookup.value)
    .select(TASK_SELECT)
    .maybeSingle();
  if (error) return toError(error.message);
  if (!data) return toError(`No task ${args.id} visible to you.`);
  return toContent(data);
}
