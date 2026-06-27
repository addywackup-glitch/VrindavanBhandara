import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const UpdateMessageSchema = z.object({
  isRead: z.boolean().optional(),
  isReplied: z.boolean().optional(),
  adminNotes: z.string().max(2000).optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdmin("bookings:read");
    const { id } = await params;
    const body = await request.json();
    const data = UpdateMessageSchema.parse(body);

    const existing = await prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const updated = await prisma.contactMessage.update({ where: { id }, data });

    void createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "ContactMessage",
      entityId: id,
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
    const session = await requireAdmin("bookings:write");
    const { id } = await params;

    await prisma.contactMessage.delete({ where: { id } });

    void createAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entity: "ContactMessage",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
