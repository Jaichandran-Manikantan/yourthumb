export type ActiveJobType = "IDEATION" | "BASE_RENDER" | "TWEAK";

export type GenerationStatus =
  | "PENDING"
  | "CHECKPOINT"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "FAILED_TOS"
  | "ABANDONED"
  | "EXPIRED";

export type AssetStagingItem = {
  whatToPhotograph: string;
  quantity: number;
  pose: string;
  facialExpression: string;
  gazeDirection: string;
  framing: string;
  cameraAngle: string;
  lighting: string;
  background: string;
  clothingOrProps: string;
  orientation: string;
  placementInThumbnail: string;
  whyNeeded: string;
};

export type AssetStagingInstructions = {
  requestedAssets?: AssetStagingItem[];
  assets_needed?: number;
  assets?: Array<Record<string, unknown>>;
  _ai_strategy?: Record<string, unknown>;
};

export type GenerationRecord = {
  id: string;
  user_id: string;
  status: GenerationStatus;
  workflow: "FRAME" | "ASSET" | "COPYCAT";
  topic: string;
  /** Legacy database column; semantically this is the user's Thumbnail Idea / Angle. */
  transcript: string | null;
  inspiration_urls: string[];
  frame_url: string | null;
  frame_description?: string | null;
  background_mode?: "ai" | "upload" | null;
  background_url?: string | null;
  background_prompt?: string | null;
  visual_concept: string | null;
  strategic_hook?: unknown;
  concept_signature?: string | null;
  viral_titles: string[] | null;
  title_options: string[] | null;
  asset_staging_instructions: AssetStagingInstructions | null;
  rejected_concepts: string[];
  selected_title: string | null;
  asset_urls: string[];
  asset_slot_urls?: Array<string | null> | null;
  ai_generated_slots?: Record<string, boolean> | null;
  generate_with_ai?: boolean | null;
  render_retry_count?: number | null;
  last_tweak_prompt?: string | null;
  render_error?: string | null;
  tweak_error?: string | null;
  message_id?: string | null;
  worker_run_id?: string | null;
  processing_started_at?: string | null;
  final_image_url: string | null;
  retry_count: number;
  retry_claim_id?: string | null;
  retry_claimed_at?: string | null;
  ideation_claim_id?: string | null;
  ideation_claimed_at?: string | null;
  thumbnail_text_mode?: "auto" | "custom" | null;
  custom_thumbnail_text?: string | null;
  include_creator?: boolean | null;
  ideation_background_mode?: "ai" | "upload" | null;
  ideation_background_url?: string | null;
  ideation_background_prompt?: string | null;
  created_at: string;
  expires_at?: string | null;
  abandoned_at?: string | null;
  credit_refunded?: boolean | null;
  active_job_type?: ActiveJobType | null;
};

export function titleOptionsFrom(record: GenerationRecord): string[] {
  return record.title_options?.length
    ? record.title_options
    : (record.viral_titles ?? []);
}

export function requiredAssetCount(record: GenerationRecord): number {
  const staging = record.asset_staging_instructions;
  const requested = staging?.requestedAssets?.reduce(
    (sum, item) => sum + (Number(item.quantity) || 1),
    0
  );
  const actual = Array.isArray(staging?.assets) ? staging.assets.length : 0;
  if (record.workflow === "FRAME") return 0;
  const count = requested ?? actual;
  return Math.min(Math.max(count, 0), 3);
}