// =============================================================================
// VRINDAVAN BHANDARA — Contact Message Service (admin)
// =============================================================================

import { z } from "zod";
import { messageRepository } from "@/lib/repositories";
import { execute, validate } from "@/lib/api/service";
import { NotFoundError } from "@/lib/errors";
import { createAuditLog } from "@/lib/audit";
import type { Actor } from "@/lib/services/actor";

export const UpdateMessageSchema = z.object({
  isRead: z.boolean().optional(),
  isReplied: z.boolean().optional(),
  adminNotes: z.string().max(2000).optional().nullable(),
});

export function updateMessage(actor: Actor, id: string, input: unknown) {
  return execute(async () => {
    const data = validate(UpdateMessageSchema, input);

    const existing = await messageRepository.findById(id);
    if (!existing) throw new NotFoundError("Message");

    const updated = await messageRepository.update(id, data);
    await createAuditLog({
      userId: actor.userId,
      action: "UPDATE",
      entity: "ContactMessage",
      entityId: id,
      newData: data,
    });

    return updated;
  }, "Message updated");
}

export function deleteMessage(actor: Actor, id: string) {
  return execute(async () => {
    const existing = await messageRepository.findById(id);
    if (!existing) throw new NotFoundError("Message");

    await messageRepository.delete(id);
    await createAuditLog({
      userId: actor.userId,
      action: "DELETE",
      entity: "ContactMessage",
      entityId: id,
    });

    return { id };
  }, "Message deleted");
}
