import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRateLimit } from "@/lib/rate-limit";

// GET /api/packages — Public route to list active packages
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await apiRateLimit(ip);
  if (!rl.success) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const serviceType = searchParams.get("serviceType");
  const slug = searchParams.get("serviceSlug");

  try {
    const packages = await prisma.package.findMany({
      where: {
        isActive: true,
        ...(serviceType || slug
          ? {
              serviceCategory: {
                ...(serviceType ? { type: serviceType as never } : {}),
                ...(slug ? { slug } : {}),
              },
            }
          : {}),
      },
      include: {
        serviceCategory: {
          select: { id: true, name: true, slug: true, type: true },
        },
        items: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    });

    return NextResponse.json({ success: true, data: packages });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
