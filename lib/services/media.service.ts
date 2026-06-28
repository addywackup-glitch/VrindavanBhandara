// =============================================================================
// VRINDAVAN BHANDARA — Media Service (proof uploads metadata)
// =============================================================================

import { z } from "zod";
import {
  bookingRepository,
  mediaRepository,
  proofTimelineRepository,
  runTransaction,
} from "@/lib/repositories";
import { execute, validate } from "@/lib/api/service";
import { NotFoundError } from "@/lib/errors";
import { createAuditLog } from "@/lib/audit";
import type { Actor } from "@/lib/services/actor";

// Accept "IMAGE" (client UI) and "PHOTO"/"VIDEO"/"DOCUMENT" → DB enum.
export const AddProofSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  type: z
    .enum(["IMAGE", "VIDEO", "PHOTO", "DOCUMENT"])
    .transform((v) => (v === "IMAGE" ? "PHOTO" : v)),
  caption: z.string().max(200).optional(),
  isPublic: z.boolean().optional().default(true),
});

export function addProof(actor: Actor, bookingId: string, input: unknown) {
  return execute(async () => {
    const data = validate(AddProofSchema, input);

    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError("Booking");

    const proof = await runTransaction(async (tx) => {
      const created = await mediaRepository.create(
        {
          bookingId,
          url: data.url,
          type: data.type,
          caption: data.caption ?? null,
          isPublic: data.isPublic,
          uploadedBy: actor.userId,
        },
        tx
      );

      const count = await mediaRepository.countForBooking(bookingId, tx);
      if (count === 1) {
        await proofTimelineRepository.create(
          {
            bookingId,
            eventType: "PHOTOS_UPLOADED",
            title: "Proof Uploaded",
            description: "Photo/video proof of your seva has been uploaded.",
            createdBy: actor.userId,
            isVisible: true,
          },
          tx
        );
      }

      return created;
    });

    await createAuditLog({
      userId: actor.userId,
      action: "CREATE",
      entity: "MediaProof",
      entityId: proof.id,
      metadata: { bookingId, type: data.type, url: data.url },
    });

    return proof;
  }, "Proof uploaded");
}

export function listProofs(bookingId: string) {
  return execute(async () => mediaRepository.listForBooking(bookingId));
}
