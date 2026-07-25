import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ServicesClient } from "@/components/admin/ServicesClient";
import { ServiceTypeEnum } from "@/lib/validations";

export const metadata: Metadata = { title: "Services" };

export default async function AdminServicesPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

  const services = await prisma.serviceCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { packages: true } } },
  });

  const used = new Set(services.map((s) => s.type));
  const availableTypes = ServiceTypeEnum.options.filter((t) => !used.has(t));

  const [active, inactive] = await Promise.all([
    prisma.serviceCategory.count({ where: { isActive: true } }),
    prisma.serviceCategory.count({ where: { isActive: false } }),
  ]);

  return (
    <>
      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">Services</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            {services.length} service categories · manage catalog, SEO, and page content
          </p>
        </div>
        <Link
          href="/admin/services/new"
          className="adm-topbar-btn"
          style={availableTypes.length === 0 ? { opacity: 0.5, pointerEvents: "none" } : undefined}
        >
          + New Service
        </Link>
      </div>

      <div className="adm-stats-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {[
          { label: "Total", value: services.length },
          { label: "Active", value: active },
          { label: "Inactive", value: inactive },
        ].map((s) => (
          <div key={s.label} className="adm-stat-card">
            <div className="adm-stat-label">{s.label}</div>
            <div className="adm-stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <ServicesClient
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          type: s.type,
          shortDesc: s.shortDesc,
          isActive: s.isActive,
          sortOrder: s.sortOrder,
          packageCount: s._count.packages,
          icon: s.icon,
        }))}
        availableTypes={availableTypes}
      />
    </>
  );
}
