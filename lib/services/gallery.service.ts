// =============================================================================
// VRINDAVAN BHANDARA — Gallery Service (admin CRUD)
// =============================================================================

import { Prisma, type GalleryCategory } from "@prisma/client";
import { z } from "zod";
import { galleryRepository } from "@/lib/repositories";
import { execute, validate } from "@/lib/api/service";
import { paginated, parsePagination, type PageQuery } from "@/lib/api/pagination";
import { NotFoundError } from "@/lib/errors";
import { createAuditLog } from "@/lib/audit";
import type { Actor } from "@/lib/services/actor";

const GALLERY_CATEGORIES = [
  "BHANDARA",
  "BRAHMIN_BHOJ",
  "GAU_SEVA",
  "SADHU_BHOJAN",
  "FESTIVAL",
  "TEMPLE",
  "GENERAL",
] as const;

export const CreateGallerySchema = z.object({
  url: z.string().url(),
  thumbnail: z.string().url().optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  category: z.enum(GALLERY_CATEGORIES),
  tags: z.array(z.string().max(50)).max(20).default([]),
  location: z.string().max(100).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  bookingId: z.string().cuid().optional(),
});

export const UpdateGallerySchema = z.object({
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  category: z.enum(GALLERY_CATEGORIES).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  location: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

type ListQuery = PageQuery & {
  category?: string | null;
  search?: string | null;
  isFeatured?: string | null;
};

export function listGallery(query: ListQuery) {
  return execute(async () => {
    const { page, pageSize, skip } = parsePagination(query, { defaultPageSize: 24 });
    const category = query.category;
    const search = query.search ?? "";

    const where: Prisma.GalleryImageWhereInput = {
      ...(category && category !== "ALL"
        ? { category: category as GalleryCategory }
        : {}),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(query.isFeatured === "true" || query.isFeatured === "false"
        ? { isFeatured: query.isFeatured === "true" }
        : {}),
    };

    const [items, total] = await Promise.all([
      galleryRepository.list({ where, skip, take: pageSize }),
      galleryRepository.count(where),
    ]);

    return paginated(items, total, page, pageSize);
  });
}

export function createGalleryImage(actor: Actor, input: unknown) {
  return execute(async () => {
    const data = validate(CreateGallerySchema, input);
    const image = await galleryRepository.create({ ...data, uploadedBy: actor.userId });

    await createAuditLog({
      userId: actor.userId,
      action: "UPLOAD",
      entity: "GalleryImage",
      entityId: image.id,
      newData: { category: data.category, url: data.url },
    });

    return image;
  }, "Image added");
}

export function updateGalleryImage(actor: Actor, id: string, input: unknown) {
  return execute(async () => {
    const data = validate(UpdateGallerySchema, input);

    const existing = await galleryRepository.findById(id);
    if (!existing) throw new NotFoundError("Image");

    const updated = await galleryRepository.update(id, data);

    await createAuditLog({
      userId: actor.userId,
      action: "UPDATE",
      entity: "GalleryImage",
      entityId: id,
      oldData: { isActive: existing.isActive, isFeatured: existing.isFeatured },
      newData: data,
    });

    return updated;
  }, "Image updated");
}

export function deleteGalleryImage(actor: Actor, id: string) {
  return execute(async () => {
    const existing = await galleryRepository.findById(id);
    if (!existing) throw new NotFoundError("Image");

    await galleryRepository.delete(id);
    await createAuditLog({
      userId: actor.userId,
      action: "DELETE",
      entity: "GalleryImage",
      entityId: id,
    });

    return { id };
  }, "Image deleted");
}
