import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiRateLimit } from "@/lib/rate-limit";

// GET /api/testimonials — Public, returns approved/featured testimonials
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await apiRateLimit(ip);
  if (!rl.success) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const featured = searchParams.get("featured") === "true";
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "12", 10));

  try {
    const testimonials = await prisma.testimonial.findMany({
      where: {
        isApproved: true,
        ...(featured ? { isFeatured: true } : {}),
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        rating: true,
        comment: true,
        serviceType: true,
        isFeatured: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ success: true, data: testimonials });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
