import { z } from "zod";
import { getClient } from "../auth.js";
import {
  zKnowledgeCategory, zTeamScope,
  KnowledgeCategory, TeamScope,
} from "../enums.js";

export const logKnowledgeInput = {
  title: z.string().min(1).max(200).describe(
    "Short headline. Will be the row title in the dashboard.",
  ),
  content: z.string().min(1).describe(
    "Full body. Markdown is fine. Aim for 'useful next month'; chat noise " +
    "doesn't belong here.",
  ),
  category: zKnowledgeCategory.describe(
    "research / decision / contact / client / task / reference / insight / status",
  ),
  scope: zTeamScope.default("venture").describe(
    "venture (visible to Clover Digital teammates) or private (just you).",
  ),
  is_private: z.boolean().default(false).describe(
    "Set true for credentials/PII/financials. Combined with scope, controls " +
    "visibility.",
  ),
  tags: z.array(z.string()).optional(),
};

export const listKnowledgeInput = {
  category: zKnowledgeCategory.optional(),
  search: z.string().optional().describe(
    "Substring match on title (case-insensitive).",
  ),
  limit: z.number().int().min(1).max(100).default(20),
};

export const getKnowledgeInput = { id: z.string().uuid() };

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

const KNOWLEDGE_SELECT =
  "id, title, content, category, visibility, source_agent, source_channel, " +
  "is_private, tags, related_task_id, related_goal_id, created_at, updated_at";

export async function handleLogKnowledge(args: {
  title: string;
  content: string;
  category: KnowledgeCategory;
  scope?: TeamScope;
  is_private?: boolean;
  tags?: string[];
}) {
  const client = await getClient();
  const isPrivate = args.is_private === true || args.scope === "private";
  const row = {
    title: args.title,
    content: args.content,
    category: args.category,
    visibility: isPrivate ? "private" : "internal",
    is_private: isPrivate,
    tags: args.tags ?? [],
    source_agent: "clover-mcp",
    source_channel: "mcp",
  };
  const { data, error } = await client
    .from("cd_knowledge")
    .insert(row)
    .select(KNOWLEDGE_SELECT)
    .single();
  if (error) return toError(error.message);
  return toContent(data);
}

export async function handleListKnowledge(args: {
  category?: KnowledgeCategory;
  search?: string;
  limit?: number;
}) {
  const client = await getClient();
  let q = client
    .from("cd_knowledge")
    .select(KNOWLEDGE_SELECT)
    .order("created_at", { ascending: false })
    .limit(args.limit ?? 20);
  if (args.category) q = q.eq("category", args.category);
  if (args.search) q = q.ilike("title", `%${args.search}%`);
  const { data, error } = await q;
  if (error) return toError(error.message);
  return toContent({ count: data?.length ?? 0, items: data });
}

export async function handleGetKnowledge(args: { id: string }) {
  const client = await getClient();
  const { data, error } = await client
    .from("cd_knowledge")
    .select(KNOWLEDGE_SELECT)
    .eq("id", args.id)
    .maybeSingle();
  if (error) return toError(error.message);
  if (!data) return toError(`No knowledge entry ${args.id} visible to you.`);
  return toContent(data);
}
