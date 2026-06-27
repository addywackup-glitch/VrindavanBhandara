import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const UpdateGallerySchema = z.object({
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  category: z.enum(["BHANDARA", "BRAHMIN_BHOJ", "GAU_SEVA", "SADHU_BHOJAN", "FESTIVAL", "TEMPLE", "GENERAL"]).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  location: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdmin("gallery:write");
    const { id } = await params;
    const body = await request.json();
    const data = UpdateGallerySchema.parse(body);

    const existing = await prisma.galleryImage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Image not found" }, { status: 404 });

    const updated = await prisma.galleryImage.update({ where: { id }, data });

    void createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "GalleryImage",
      entityId: id,
      oldData: { isActive: existing.isActive, isFeatured: existing.isFeatured },
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
    const session = await requireAdmin("gallery:write");
    const { id } = await params;

    const existing = await prisma.galleryImage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Image not found" }, { status: 404 });

    await prisma.galleryImage.delete({ where: { id } });

    void createAuditLog({ userId: session.user.id, action: "DELETE", entity: "GalleryImage", entityId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
