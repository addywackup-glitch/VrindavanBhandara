import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { CreatePackageSchema } from "@/lib/validations";
import { z } from "zod";

// =============================================================================
// GET /api/admin/packages — List packages with pagination + search + filter
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin("packages:read");
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));
    const search = searchParams.get("search") ?? "";
    const categoryId = searchParams.get("categoryId") ?? "";
    const isActive = searchParams.get("isActive");
    const sortBy = searchParams.get("sortBy") ?? "sortOrder";
    const sortDir = (searchParams.get("sortDir") ?? "asc") as "asc" | "desc";

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(categoryId && { serviceCategoryId: categoryId }),
      ...(isActive !== null && isActive !== "" && { isActive: isActive === "true" }),
    };

    const validSortFields = ["sortOrder", "name", "price", "createdAt"] as const;
    const orderBy = validSortFields.includes(sortBy as never)
      ? { [sortBy]: sortDir }
      : { sortOrder: "asc" as const };

    const [packages, total, categories] = await Promise.all([
      prisma.package.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          serviceCategory: { select: { id: true, name: true, type: true } },
          items: { orderBy: { sortOrder: "asc" } },
          _count: { select: { bookings: true } },
        },
      }),
      prisma.package.count({ where }),
      prisma.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

    void createAuditLog({ userId: session.user.id, action: "READ", entity: "Package", metadata: { page, search } });

    return NextResponse.json({
      success: true,
      data: packages,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
      categories,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("[API] GET /admin/packages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// =============================================================================
// POST /api/admin/packages — Create package
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin("packages:write");
    const body = await request.json();
    const data = CreatePackageSchema.parse(body);

    // Auto-generate slug if not unique
    const existing = await prisma.package.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug already exists. Choose a unique slug." }, { status: 409 });
    }

    const { items, ...packageData } = data;

    const pkg = await prisma.package.create({
      data: {
        ...packageData,
        price: packageData.price,
        ...(packageData.originalPrice && { originalPrice: packageData.originalPrice }),
        items: items?.length
          ? { create: items.map((item, i) => ({ ...item, sortOrder: item.sortOrder ?? i })) }
          : undefined,
      },
      include: {
        serviceCategory: true,
        items: true,
      },
    });

    void createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "Package",
      entityId: pkg.id,
      newData: { name: pkg.name, price: pkg.price },
    });

    return NextResponse.json({ success: true, data: pkg }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("[API] POST /admin/packages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
