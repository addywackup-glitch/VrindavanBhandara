// =============================================================================
// VRINDAVAN BHANDARA — Settings Service (SiteConfig)
// =============================================================================

import { z } from "zod";
import { settingsRepository } from "@/lib/repositories";
import { execute, validate } from "@/lib/api/service";
import { createAuditLog } from "@/lib/audit";
import type { Actor } from "@/lib/services/actor";

export const UpsertSettingSchema = z.object({
  key: z.string().min(1).max(200),
  value: z.string().max(10000),
  type: z.enum(["string", "number", "boolean", "json"]).default("string"),
  label: z.string().max(200).optional(),
  group: z.string().max(100).optional(),
});

export function listSettings() {
  return execute(async () => settingsRepository.listAll());
}

export function upsertSetting(actor: Actor, input: unknown) {
  return execute(async () => {
    const data = validate(UpsertSettingSchema, input);
    const existing = await settingsRepository.findByKey(data.key);

    const setting = await settingsRepository.upsert({
      key: data.key,
      create: {
        key: data.key,
        value: data.value,
        type: data.type,
        label: data.label ?? data.key,
        group: data.group ?? "general",
        updatedBy: actor.userId,
      },
      update: { value: data.value, type: data.type, updatedBy: actor.userId },
    });

    await createAuditLog({
      userId: actor.userId,
      action: "UPDATE",
      entity: "SiteConfig",
      entityId: data.key,
      oldData: existing ? { value: existing.value } : undefined,
      newData: { value: data.value },
    });

    return setting;
  }, "Setting saved");
}
