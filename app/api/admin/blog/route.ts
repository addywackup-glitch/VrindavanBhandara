import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { CreateBlogSchema } from "@/lib/validations";
import { z } from "zod";

// =============================================================================
// GET /api/admin/blog
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin("blogs:read");
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(50, Number(searchParams.get("pageSize") ?? 20));
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "";

    const where = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { excerpt: { contains: search, mode: "insensitive" as const } },
          { tags: { has: search } },
        ],
      }),
      ...(status && status !== "ALL" && { status: status as never }),
    };

    const [posts, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.blog.count({ where }),
    ]);

    void createAuditLog({ userId: session.user.id, action: "READ", entity: "Blog", metadata: { page } });

    return NextResponse.json({
      success: true,
      data: posts,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// =============================================================================
// POST /api/admin/blog — Create post
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin("blogs:write");
    const body = await request.json();
    const data = CreateBlogSchema.parse(body);

    // Prevent slug collision
    const existing = await prisma.blog.findUnique({ where: { slug: data.slug } });
    if (existing) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

    const post = await prisma.blog.create({
      data: {
        ...data,
        authorId: session.user.id,
        authorName: session.user.name ?? "Admin",
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      },
    });

    void createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "Blog",
      entityId: post.id,
      newData: { title: post.title, status: post.status },
    });

    return NextResponse.json({ success: true, data: post }, { status: 201 });
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
