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
    <>
      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">Packages</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            {total} packages across all service categories
          </p>
        </div>
        <Link href="/admin/packages/new" className="adm-topbar-btn">+ New Package</Link>
      </div>

      <div className="adm-stats-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {[
          { label: "Active", value: active },
          { label: "Inactive", value: inactive },
          { label: "Featured", value: featured },
        ].map((s) => (
          <div key={s.label} className="adm-stat-card">
            <div className="adm-stat-label">{s.label}</div>
            <div className="adm-stat-value">{s.value}</div>
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
    </>
  );
}
