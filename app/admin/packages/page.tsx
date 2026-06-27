import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PackagesClient } from "@/components/admin/PackagesClient";

export const metadata: Metadata = { title: "Packages" };

type SearchParams = { search?: string; page?: string; categoryId?: string; active?: string };

async function getPackages({ search, page, categoryId, active }: SearchParams) {
  const p = Math.max(1, Number(page ?? 1));
  const pageSize = 20;

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(categoryId && { serviceCategoryId: categoryId }),
    ...(active === "true" && { isActive: true }),
    ...(active === "false" && { isActive: false }),
  };

  const [packages, total, categories] = await Promise.all([
    prisma.package.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (p - 1) * pageSize,
      take: pageSize,
      include: {
        serviceCategory: { select: { id: true, name: true } },
        _count: { select: { bookings: true } },
        items: { orderBy: { sortOrder: "asc" }, take: 5 },
      },
    }),
    prisma.package.count({ where }),
    prisma.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return { packages, total, page: p, totalPages: Math.ceil(total / pageSize), categories };
}

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const { packages, total, page, totalPages, categories } = await getPackages(params);

  const [active, inactive, featured] = await Promise.all([
    prisma.package.count({ where: { isActive: true } }),
    prisma.package.count({ where: { isActive: false } }),
    prisma.package.count({ where: { isFeatured: true } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Packages</h1>
          <p className="text-gray-500 text-sm mt-1">{total} packages across all service categories.</p>
        </div>
        <Link
          href="/admin/packages/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #8B1E1E, #B89947)" }}
        >
          + New Package
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Active", count: active, color: "#15803d" },
          { label: "Inactive", count: inactive, color: "#6b7280" },
          { label: "Featured", count: featured, color: "#B89947" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 text-center" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <PackagesClient
        packages={packages.map((pkg) => ({
          id: pkg.id,
          name: pkg.name,
          slug: pkg.slug,
          price: Number(pkg.price),
          originalPrice: pkg.originalPrice ? Number(pkg.originalPrice) : null,
          isActive: pkg.isActive,
          isFeatured: pkg.isFeatured,
          badge: pkg.badge,
          duration: pkg.duration,
          sortOrder: pkg.sortOrder,
          bookingCount: pkg._count.bookings,
          serviceCategory: pkg.serviceCategory,
          items: pkg.items.map((item) => ({ description: item.description })),
        }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        total={total}
        page={page}
        totalPages={totalPages}
        filter={params.categoryId ?? "ALL"}
      />
    </div>
  );
}
