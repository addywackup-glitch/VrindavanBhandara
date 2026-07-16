// =============================================================================
// Supabase Storage — proofs, gallery, blog media.
// Replaces planned Cloudflare R2 uploads.
// =============================================================================

import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseUrl } from "@/lib/supabase/env";

export const STORAGE_BUCKETS = {
  proofs: "proofs",
  gallery: "gallery",
  blog: "blog",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

const ALLOWED_MIME: Record<StorageBucket, string[]> = {
  proofs: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "application/pdf",
  ],
  gallery: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  blog: ["image/jpeg", "image/png", "image/webp", "image/gif"],
};

const MAX_BYTES: Record<StorageBucket, number> = {
  proofs: 50 * 1024 * 1024, // 50 MB
  gallery: 10 * 1024 * 1024,
  blog: 10 * 1024 * 1024,
};

export function getPublicStorageUrl(bucket: StorageBucket, path: string): string {
  const base = getSupabaseUrl().replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function uploadToSupabaseStorage(params: {
  bucket: StorageBucket;
  path: string;
  body: Buffer | Blob | ArrayBuffer;
  contentType: string;
  upsert?: boolean;
}): Promise<{ path: string; publicUrl: string }> {
  const allowed = ALLOWED_MIME[params.bucket];
  if (!allowed.includes(params.contentType)) {
    throw new Error(`Unsupported file type: ${params.contentType}`);
  }

  const size =
    params.body instanceof Buffer
      ? params.body.byteLength
      : params.body instanceof ArrayBuffer
        ? params.body.byteLength
        : (params.body as Blob).size;

  if (size > MAX_BYTES[params.bucket]) {
    throw new Error(`File too large for bucket ${params.bucket}`);
  }

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(params.bucket)
    .upload(params.path, params.body, {
      contentType: params.contentType,
      upsert: params.upsert ?? false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    path: params.path,
    publicUrl: getPublicStorageUrl(params.bucket, params.path),
  };
}

/** Ensure public buckets exist (idempotent). Call once on deploy / seed. */
export async function ensureStorageBuckets(): Promise<void> {
  const admin = createAdminClient();
  for (const bucket of Object.values(STORAGE_BUCKETS)) {
    const { data: existing } = await admin.storage.getBucket(bucket);
    if (!existing) {
      await admin.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: MAX_BYTES[bucket],
        allowedMimeTypes: ALLOWED_MIME[bucket],
      });
    }
  }
}
