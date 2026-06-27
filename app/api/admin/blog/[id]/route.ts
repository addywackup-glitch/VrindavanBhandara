import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const UpdateBlogSchema = z.object({
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

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin("blogs:read");
    const { id } = await params;
    const post = await prisma.blog.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdmin("blogs:write");
    const { id } = await params;
    const body = await request.json();
    const data = UpdateBlogSchema.parse(body);

    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    // Check slug uniqueness if slug is changing
    if (data.slug && data.slug !== existing.slug) {
      const conflict = await prisma.blog.findUnique({ where: { slug: data.slug } });
      if (conflict) return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
    }

    const updated = await prisma.blog.update({
      where: { id },
      data: {
        ...data,
        // Auto-set publishedAt when transitioning from non-PUBLISHED to PUBLISHED
        ...(data.status === "PUBLISHED" && !existing.publishedAt && { publishedAt: new Date() }),
      },
    });

    void createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "Blog",
      entityId: id,
      oldData: { status: existing.status, title: existing.title },
      newData: data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdmin("blogs:delete");
    const { id } = await params;

    const existing = await prisma.blog.findUnique({ where: { id }, select: { title: true } });
    if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    await prisma.blog.delete({ where: { id } });

    void createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entity: "Blog",
      entityId: id,
      metadata: { title: existing.title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
