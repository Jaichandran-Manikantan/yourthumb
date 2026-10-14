import { createClient } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";

export type UploadResult = {
  url: string;
  path: string;
};

export const STYLE_ANCHORS_BUCKET = "style-anchors";
export const THUMBNAILS_BUCKET = "thumbnails";

// Retention policy for generation-related image storage.
// Generation sessions expire after 24h, while reference and generated
// thumbnails may remain available for up to 30 days.
export const GENERATION_SESSION_RETENTION_MS = 24 * 60 * 60 * 1000;
export const THUMBNAIL_RETENTION_MS = 720 * 60 * 60 * 1000;
export const REFERENCE_THUMBNAIL_RETENTION_MS = 720 * 60 * 60 * 1000;

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Only PNG, JPG, and WEBP files are accepted.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File must be smaller than 10 MB.";
  }
  return null;
}

export async function uploadFileToStorage(
  file: File,
  bucket: string,
  pathPrefix?: string
): Promise<UploadResult> {
  const validation = validateImageFile(file);
  if (validation) throw new Error(validation);

  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = pathPrefix ? `${pathPrefix}/${fileName}` : fileName;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return { url: publicUrl, path: filePath };
}

export async function removeFileFromStorage(
  bucket: string,
  path: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(error.message);
}

export async function uploadBufferToStorage(
  buffer: Buffer,
  bucket: string,
  fileName: string,
  contentType: string = "image/png"
): Promise<string> {
  const admin = createAdminClient();
  
  // Convert Node Buffer to Uint8Array for bulletproof Supabase multipart fetch upload
  const uint8 = new Uint8Array(buffer);

  const { error } = await admin.storage
    .from(bucket)
    .upload(fileName, uint8, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error("❌ Supabase storage upload error details:", error);
    throw new Error(`Failed to upload thumbnail to Supabase bucket "${bucket}": ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(bucket).getPublicUrl(fileName);

  return publicUrl;
}

export async function deleteStorageFiles(
  bucket: string,
  filePaths: string[]
): Promise<void> {
  if (!filePaths || filePaths.length === 0) return;
  const admin = createAdminClient();
  const { error } = await admin.storage.from(bucket).remove(filePaths);
  if (error) {
    console.error(`Failed to delete files from ${bucket}:`, error);
  }
}

export function extractStoragePath(publicUrl: string, bucket: string): string | null {
  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = url.pathname.indexOf(marker);
    if (index !== -1) {
      return decodeURIComponent(url.pathname.substring(index + marker.length));
    }
    return null;
  } catch {
    return null;
  }
}