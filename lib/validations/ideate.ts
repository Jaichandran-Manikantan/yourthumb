/**
 * Public request boundary only. TRADE_SECRET: internal concept-output schemas,
 * strategy taxonomy, reference-fingerprint schema, and rendering handoff schemas
 * are intentionally omitted. The hosted backend validates generation outputs.
 */
import { z } from "zod";
export const WorkflowSchema = z.enum(["FRAME", "ASSET", "COPYCAT"]);
export type Workflow = z.infer<typeof WorkflowSchema>;
const maxWords = (value: string | null | undefined, limit: number) =>
  !value || value.trim().split(/\s+/).filter(Boolean).length <= limit;
export const IdeateRequestSchema = z.object({
  generationId: z.string().uuid().optional(),
  workflow: WorkflowSchema,
  topic: z.string().min(10).max(3000).refine((v) => maxWords(v, 300)),
  thumbnailIdea: z.string().max(3000).optional().nullable().refine((v) => maxWords(v, 300)),
  thumbnailTextMode: z.enum(["auto", "custom"]).default("auto"),
  customThumbnailText: z.string().max(100).optional().nullable().refine((v) => !v || v.trim().split(/\s+/).filter(Boolean).length <= 3),
  inspirationUrls: z.array(z.string().url()).max(3).default([]),
  frameUrl: z.string().url().optional().nullable(),
  frameDescription: z.string().min(10).max(3000).optional().nullable(),
  rejectedConcepts: z.array(z.string()).max(10).optional().default([]),
  includeCreator: z.boolean().default(true),
  backgroundMode: z.enum(["upload", "ai"]).default("ai"),
  backgroundUrl: z.string().url().optional().nullable(),
  backgroundPrompt: z.string().max(2000).optional().nullable(),
});
export type IdeateRequest = z.infer<typeof IdeateRequestSchema>;
export const TRADE_SECRET = "Internal ideation output schemas are hosted privately.";
