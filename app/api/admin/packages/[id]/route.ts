import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { UpdatePackageSchema } from "@/lib/validations";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

// =============================================================================
// GET /api/admin/packages/[id]
// =============================================================================
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin("packages:read");
    const { id } = await params;

    const pkg = await prisma.package.findUnique({
      where: { id },
      include: {
        serviceCategory: true,
        items: { orderBy: { sortOrder: "asc" } },
        _count: { select: { bookings: true } },
      },
    });

    if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: pkg });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// =============================================================================
// PATCH /api/admin/packages/[id] — Update package (partial)
// =============================================================================
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdmin("packages:write");
    const { id } = await params;
    const body = await request.json();
    const data = UpdatePackageSchema.parse(body);

    const existing = await prisma.package.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Package not found" }, { status: 404 });

    // Handle items update separately for clean replace
    const { items, ...rest } = data;

    const updated = await prisma.$transaction(async (tx) => {
      if (items !== undefined) {
        await tx.packageItem.deleteMany({ where: { packageId: id } });
        if (items.length) {
          await tx.packageItem.createMany({
          data: items.map((item: { description: string; quantity: number; unit?: string; sortOrder?: number }, i: number) => ({ ...item, packageId: id, sortOrder: item.sortOrder ?? i })),
          });
        }
      }

      return tx.package.update({
        where: { id },
        data: rest,
        include: { serviceCategory: true, items: { orderBy: { sortOrder: "asc" } } },
      });
    });

    void createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "Package",
      entityId: id,
      oldData: { name: existing.name, price: existing.price, isActive: existing.isActive },
      newData: rest,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// =============================================================================
// DELETE /api/admin/packages/[id] — Soft-delete (set isActive = false)
// =============================================================================
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdmin("packages:delete");
    const { id } = await params;

    const existing = await prisma.package.findUnique({
      where: { id },
      select: { name: true, _count: { select: { bookings: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Package not found" }, { status: 404 });

    if (existing._count.bookings > 0) {
      // Soft delete — don't delete packages with existing bookings
      await prisma.package.update({ where: { id }, data: { isActive: false } });
    } else {
      await prisma.package.delete({ where: { id } });
    }

    void createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entity: "Package",
      entityId: id,
      metadata: { name: existing.name, bookingCount: existing._count.bookings },
    });

    return NextResponse.json({
      success: true,
      message: existing._count.bookings > 0 ? "Package deactivated (has existing bookings)" : "Package deleted",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
