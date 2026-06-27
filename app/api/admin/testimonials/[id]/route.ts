import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const UpdateTestimonialSchema = z.object({
  action: z.enum(["approve", "reject", "feature", "unfeature"]),
});

type Params = { params: Promise<{ id: string }> };

// =============================================================================
// PATCH /api/admin/testimonials/[id] — Approve / reject / feature
// =============================================================================
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdmin("testimonials:approve");
    const { id } = await params;
    const body = await request.json();
    const { action } = UpdateTestimonialSchema.parse(body);

    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });

    const updateData: { isApproved?: boolean; isFeatured?: boolean } = {};
    if (action === "approve") updateData.isApproved = true;
    if (action === "reject") updateData.isApproved = false;
    if (action === "feature") { updateData.isApproved = true; updateData.isFeatured = true; }
    if (action === "unfeature") updateData.isFeatured = false;

    const updated = await prisma.testimonial.update({
      where: { id },
      data: updateData,
      include: { user: { select: { name: true, email: true } } },
    });

    void createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "Testimonial",
      entityId: id,
      oldData: { isApproved: existing.isApproved, isFeatured: existing.isFeatured },
      newData: { action, ...updateData },
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

// =============================================================================
// DELETE /api/admin/testimonials/[id]
// =============================================================================
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdmin("testimonials:approve");
    const { id } = await params;

    const existing = await prisma.testimonial.findUnique({ where: { id }, select: { name: true } });
    if (!existing) return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });

    await prisma.testimonial.delete({ where: { id } });

    void createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entity: "Testimonial",
      entityId: id,
      metadata: { name: existing.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
