import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRateLimit } from "@/lib/rate-limit";

// GET /api/services — Public route to list active service categories
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await apiRateLimit(ip);
  if (!rl.success) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const services = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        type: true,
        name: true,
        slug: true,
        shortDesc: true,
        icon: true,
        metaTitle: true,
        metaDesc: true,
      },
    });
    return NextResponse.json({ success: true, data: services });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
