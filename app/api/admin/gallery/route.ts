import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const CreateGallerySchema = z.object({
  url: z.string().url(),
  thumbnail: z.string().url().optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  category: z.enum(["BHANDARA", "BRAHMIN_BHOJ", "GAU_SEVA", "SADHU_BHOJAN", "FESTIVAL", "TEMPLE", "GENERAL"]),
  tags: z.array(z.string().max(50)).max(20).default([]),
  location: z.string().max(100).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  bookingId: z.string().cuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin("gallery:write");
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(50, Number(searchParams.get("pageSize") ?? 24));
    const category = searchParams.get("category") ?? "";
    const search = searchParams.get("search") ?? "";
    const isFeatured = searchParams.get("isFeatured");

    const where = {
      ...(category && category !== "ALL" && { category: category as never }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(isFeatured !== null && isFeatured !== "" && { isFeatured: isFeatured === "true" }),
    };

    const [images, total] = await Promise.all([
      prisma.galleryImage.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.galleryImage.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: images,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin("gallery:write");
    const body = await request.json();
    const data = CreateGallerySchema.parse(body);

    const image = await prisma.galleryImage.create({
      data: { ...data, uploadedBy: session.user.id },
    });

    void createAuditLog({
      userId: session.user.id,
      action: "UPLOAD",
      entity: "GalleryImage",
      entityId: image.id,
      newData: { category: data.category, url: data.url },
    });

    return NextResponse.json({ success: true, data: image }, { status: 201 });
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
