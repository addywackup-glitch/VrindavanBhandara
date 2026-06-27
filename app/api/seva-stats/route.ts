import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRateLimit } from "@/lib/rate-limit";

// GET /api/seva-stats — Live seva statistics for homepage
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await apiRateLimit(ip);
  if (!rl.success) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const stats = await prisma.sevaStatistic.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
      select: {
        key: true,
        label: true,
        value: true,
        unit: true,
        icon: true,
        sortOrder: true,
      },
    });

    // Convert BigInt to number for JSON serialization
    const serializable = stats.map((s) => ({
      ...s,
      value: Number(s.value),
    }));

    return NextResponse.json({ success: true, data: serializable });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
