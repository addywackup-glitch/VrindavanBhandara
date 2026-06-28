// =============================================================================
// VRINDAVAN BHANDARA — Blog Service (admin CRUD)
// =============================================================================

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { blogRepository } from "@/lib/repositories";
import { execute, validate } from "@/lib/api/service";
import { paginated, parsePagination, type PageQuery } from "@/lib/api/pagination";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { createAuditLog } from "@/lib/audit";
import { CreateBlogSchema } from "@/lib/validations";
import type { Actor } from "@/lib/services/actor";

export const UpdateBlogSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().min(10).max(500).optional(),
  content: z.string().min(100).optional(),
  coverImage: z.string().url().optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  category: z.string().max(50).optional().nullable(),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDesc: z.string().max(160).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  readTimeMin: z.number().int().min(1).max(120).optional(),
});

type ListQuery = PageQuery & { search?: string | null; status?: string | null };

const BLOG_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export function listBlogs(actor: Actor, query: ListQuery) {
  return execute(async () => {
    const { page, pageSize, skip } = parsePagination(query);
    const search = query.search ?? "";
    const status = query.status;

    const where: Prisma.BlogWhereInput = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { excerpt: { contains: search, mode: "insensitive" } },
          { tags: { has: search } },
        ],
      }),
      ...(status && status !== "ALL" && BLOG_STATUSES.includes(status as (typeof BLOG_STATUSES)[number])
        ? { status: status as (typeof BLOG_STATUSES)[number] }
        : {}),
    };

    const [items, total] = await Promise.all([
      blogRepository.list({ where, skip, take: pageSize }),
      blogRepository.count(where),
    ]);

    await createAuditLog({ userId: actor.userId, action: "READ", entity: "Blog", metadata: { page } });
    return paginated(items, total, page, pageSize);
  });
}

export function getBlog(id: string) {
  return execute(async () => {
    const post = await blogRepository.findById(id);
    if (!post) throw new NotFoundError("Post");
    return post;
  });
}

export function createBlog(actor: Actor, input: unknown) {
  return execute(async () => {
    const data = validate(CreateBlogSchema, input);

    const existing = await blogRepository.findBySlug(data.slug);
    if (existing) throw new ConflictError("Slug already exists.");

    const post = await blogRepository.create({
      ...data,
      authorId: actor.userId,
      authorName: actor.name ?? "Admin",
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    });

    await createAuditLog({
      userId: actor.userId,
      action: "CREATE",
      entity: "Blog",
      entityId: post.id,
      newData: { title: post.title, status: post.status },
    });

    return post;
  }, "Post created");
}

export function updateBlog(actor: Actor, id: string, input: unknown) {
  return execute(async () => {
    const data = validate(UpdateBlogSchema, input);

    const existing = await blogRepository.findById(id);
    if (!existing) throw new NotFoundError("Post");

    if (data.slug && data.slug !== existing.slug) {
      const conflict = await blogRepository.findBySlug(data.slug);
      if (conflict) throw new ConflictError("Slug already taken.");
    }

    const post = await blogRepository.update(id, {
      ...data,
      ...(data.status === "PUBLISHED" && !existing.publishedAt
        ? { publishedAt: new Date() }
        : {}),
    });

    await createAuditLog({
      userId: actor.userId,
      action: "UPDATE",
      entity: "Blog",
      entityId: id,
      oldData: { status: existing.status, title: existing.title },
      newData: data,
    });

    return post;
  }, "Post updated");
}

export function deleteBlog(actor: Actor, id: string) {
  return execute(async () => {
    const existing = await blogRepository.findById(id);
    if (!existing) throw new NotFoundError("Post");

    await blogRepository.delete(id);
    await createAuditLog({
      userId: actor.userId,
      action: "DELETE",
      entity: "Blog",
      entityId: id,
      metadata: { title: existing.title },
    });

    return { id };
  }, "Post deleted");
}
