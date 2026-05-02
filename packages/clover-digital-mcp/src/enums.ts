/**
 * Source of truth: pg check constraints on Clover Ops.
 * This MCP exposes only Clover Digital tasks, goals, and knowledge.
 */
import { z } from "zod";

export const STATUS = [
  "queued", "researching", "planned", "plan_review",
  "running", "code_review", "testing", "deploying",
  "completed", "failed", "blocked", "cancelled",
] as const;

export const PRIORITY = ["critical", "high", "normal", "low"] as const;

export const DEPARTMENT = ["product-eng", "marketing", "sales", "ops"] as const;

// Tasks must be classified on create so the dashboard stays useful.

export const KNOWLEDGE_CATEGORY = [
  "research", "decision", "contact", "client",
  "task", "reference", "insight", "status",
] as const;

// Team-visible or private-to-the-author knowledge.
export const TEAM_SCOPE = ["venture", "private"] as const;

export const zStatus = z.enum(STATUS);
export const zPriority = z.enum(PRIORITY);
export const zDepartment = z.enum(DEPARTMENT);
export const zKnowledgeCategory = z.enum(KNOWLEDGE_CATEGORY);
export const zTeamScope = z.enum(TEAM_SCOPE);

export type Status = z.infer<typeof zStatus>;
export type Priority = z.infer<typeof zPriority>;
export type Department = z.infer<typeof zDepartment>;
export type KnowledgeCategory = z.infer<typeof zKnowledgeCategory>;
export type TeamScope = z.infer<typeof zTeamScope>;
