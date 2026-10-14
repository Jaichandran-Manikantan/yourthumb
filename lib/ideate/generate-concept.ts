/**
 * TRADE_SECRET: Proprietary concept-generation and prompt-orchestration logic
 * is hosted privately. Keep this path to preserve the original project structure.
 * Public requests are forwarded to the official hosted backend.
 */
import type { IdeateRequest } from "@/lib/validations/ideate";
export type IdeationInputs = IdeateRequest;
export async function generateThumbnailConcept(_inputs: IdeationInputs): Promise<never> {
  throw new Error("TRADE_SECRET: concept generation is available through the hosted backend only.");
}
