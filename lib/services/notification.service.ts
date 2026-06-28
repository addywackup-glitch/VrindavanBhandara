// =============================================================================
// VRINDAVAN BHANDARA — Notification Service (in-app notifications)
// =============================================================================

import { notificationRepository } from "@/lib/repositories";
import { execute } from "@/lib/api/service";
import { AuthorizationError, NotFoundError } from "@/lib/errors";
import { type Actor } from "@/lib/services/actor";

export function listNotifications(actor: Actor) {
  return execute(async () => notificationRepository.listForUser(actor.userId));
}

export function unreadCount(actor: Actor) {
  return execute(async () => ({
    count: await notificationRepository.countUnread(actor.userId),
  }));
}

export function markNotificationRead(actor: Actor, id: string) {
  return execute(async () => {
    const all = await notificationRepository.listForUser(actor.userId);
    const owned = all.find((n) => n.id === id);
    if (!owned) throw new NotFoundError("Notification");
    if (owned.userId !== actor.userId) {
      throw new AuthorizationError("You do not have access to this notification.");
    }
    return notificationRepository.markRead(id);
  });
}
