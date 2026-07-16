import { type NextRequest } from "next/server";
import {
  getClientIp,
  handle,
  requireAdmin,
} from "@/lib/api/http";
import { uploadRateLimit } from "@/lib/rate-limit";
import { RateLimitError, ValidationError } from "@/lib/errors";
import { ok } from "@/lib/api/result";
import {
  STORAGE_BUCKETS,
  sanitizeFileName,
  uploadToSupabaseStorage,
  type StorageBucket,
} from "@/lib/storage/supabase";

/**
 * POST /api/storage/upload
 * multipart/form-data: file, bucket?=proofs|gallery|blog, folder?=optional
 * Requires admin permission proofs:upload (covers proofs/gallery/blog uploads).
 */
export async function POST(request: NextRequest) {
  return handle(async () => {
    const ip = getClientIp(request);
    const rl = await uploadRateLimit(ip);
    if (!rl.success) throw new RateLimitError("Too many uploads. Please wait.");

    const actor = await requireAdmin("proofs:upload");

    const form = await request.formData();
    const file = form.get("file");
    const bucketRaw = String(form.get("bucket") ?? "proofs");
    const folder = String(form.get("folder") ?? actor.userId);

    if (!(file instanceof File)) {
      throw new ValidationError("Missing file field");
    }

    const bucketValues = Object.values(STORAGE_BUCKETS) as string[];
    if (!bucketValues.includes(bucketRaw)) {
      throw new ValidationError("Invalid storage bucket");
    }
    const bucket = bucketRaw as StorageBucket;

    const ext = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf("."))
      : "";
    const path = `${folder}/${Date.now()}-${sanitizeFileName(file.name.replace(ext, ""))}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadToSupabaseStorage({
      bucket,
      path,
      body: buffer,
      contentType: file.type || "application/octet-stream",
    });

    return ok({
      url: uploaded.publicUrl,
      path: uploaded.path,
      bucket,
      contentType: file.type,
      size: file.size,
    });
  }, { successStatus: 201 });
}
