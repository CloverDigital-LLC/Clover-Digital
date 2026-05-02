import { z } from "zod";
import { getClient } from "../auth.js";
import { zDepartment, Department } from "../enums.js";

// Read-only goals access for v1. Teammates see all Clover Digital
// goals, can navigate dependencies, but can't mutate goal rows from
// the MCP. (Mutate via the dashboard's admin UI for now.)

export const listGoalsInput = {
  department: zDepartment.optional().describe(
    "Filter to a specific department's goals.",
  ),
  status: z.enum(["planned", "in_progress", "blocked", "done", "dropped"])
    .optional(),
  include_closed: z.boolean().default(false),
};

export const getGoalInput = {
  id: z.string().min(1).describe("Goal UUID or CD-G-* public key."),
};

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

const GOAL_SELECT =
  "id, public_key, title, description, department, owner, status, priority, " +
  "target_date, success_criteria, notes, created_at, updated_at";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Lookup = { column: "id" | "public_key"; value: string };

function resolveGoalLookup(raw: string): Lookup | string {
  const value = raw.trim();
  const upper = value.toUpperCase();
  if (upper.startsWith("CD-G-")) return { column: "public_key", value: upper };
  if (UUID_RE.test(value)) return { column: "id", value };
  return "This MCP only accepts Clover goal UUIDs or CD-G-* public keys.";
}

export async function handleListGoals(args: {
  department?: Department;
  status?: string;
  include_closed?: boolean;
}) {
  const client = await getClient();
  let q = client
    .from("cd_goals")
    .select(GOAL_SELECT)
    .order("priority", { ascending: true, nullsFirst: false })
    .order("target_date", { ascending: true, nullsFirst: false });
  if (args.department) q = q.eq("department", args.department);
  if (args.status) q = q.eq("status", args.status);
  if (!args.include_closed) q = q.not("status", "in", "(done,dropped)");
  const { data, error } = await q;
  if (error) return toError(error.message);
  return toContent({ count: data?.length ?? 0, goals: data });
}

export async function handleGetGoal(args: { id: string }) {
  const client = await getClient();
  const lookup = resolveGoalLookup(args.id);
  if (typeof lookup === "string") return toError(lookup);
  const goalRes = await client
    .from("cd_goals")
    .select(GOAL_SELECT)
    .eq(lookup.column, lookup.value)
    .maybeSingle();
  if (goalRes.error) return toError(goalRes.error.message);
  if (!goalRes.data) return toError(`No goal ${args.id} visible to you.`);
  const goal = goalRes.data as unknown as { id: string };
  const { data: linkedTasks, error: tasksError } = await client
    .from("cd_tasks")
    .select("id, ticket_key, title, status, department, priority")
    .eq("goal_id", goal.id)
    .order("created_at", { ascending: false });
  if (tasksError) return toError(tasksError.message);

  return toContent({
    goal: goalRes.data,
    linked_tasks: linkedTasks ?? [],
  });
}
