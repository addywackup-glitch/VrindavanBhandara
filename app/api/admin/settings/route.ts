import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const UpsertSettingSchema = z.object({
  key: z.string().min(1).max(200),
  value: z.string().max(10000),
  type: z.enum(["string", "number", "boolean", "json"]).default("string"),
  label: z.string().max(200).optional(),
  group: z.string().max(100).optional(),
});

export async function GET() {
  try {
    await requireAdmin("config:write");
    const settings = await prisma.siteConfig.findMany({ orderBy: { group: "asc" } });
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin("config:write");
    const body = await request.json();
    const data = UpsertSettingSchema.parse(body);

    const existing = await prisma.siteConfig.findUnique({ where: { key: data.key } });

    const setting = await prisma.siteConfig.upsert({
      where: { key: data.key },
      create: {
        key: data.key,
        value: data.value,
        type: data.type,
        label: data.label ?? data.key,
        group: data.group ?? "general",
        updatedBy: session.user.id,
      },
      update: {
        value: data.value,
        type: data.type,
        updatedBy: session.user.id,
      },
    });

    void createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "SiteConfig",
      entityId: data.key,
      oldData: existing ? { value: existing.value } : undefined,
      newData: { value: data.value },
    });

    return NextResponse.json({ success: true, data: setting });
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
