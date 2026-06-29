import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TestimonialsClient, TestimonialsSearch } from "@/components/admin/TestimonialsClient";

export const metadata: Metadata = { title: "Testimonials" };

type SearchParams = { filter?: string; page?: string; search?: string };

async function getTestimonials({ filter, page, search }: SearchParams) {
  const p = Math.max(1, Number(page ?? 1));
  const pageSize = 15;

  const where = {
    ...(filter === "PENDING" && { isApproved: false }),
    ...(filter === "APPROVED" && { isApproved: true, isFeatured: false }),
    ...(filter === "FEATURED" && { isFeatured: true }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { comment: { contains: search, mode: "insensitive" as const } },
        { city: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [testimonials, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
      skip: (p - 1) * pageSize,
      take: pageSize,
    }),
    prisma.testimonial.count({ where }),
  ]);

  return { testimonials, total, page: p, totalPages: Math.ceil(total / pageSize) };
}

export default async function TestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const filter = params.filter ?? "ALL";
  const { testimonials, total, page, totalPages } = await getTestimonials(params);

  const [totalPending, totalApproved, totalFeatured] = await Promise.all([
    prisma.testimonial.count({ where: { isApproved: false } }),
    prisma.testimonial.count({ where: { isApproved: true } }),
    prisma.testimonial.count({ where: { isFeatured: true } }),
  ]);

  return (
    <>
      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">Testimonials</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Moderate and feature customer reviews
          </p>
        </div>
      </div>

      <div className="adm-stats-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {[
          { label: "Pending Review", value: totalPending },
          { label: "Approved", value: totalApproved },
          { label: "Featured", value: totalFeatured },
        ].map((s) => (
          <div key={s.label} className="adm-stat-card">
            <div className="adm-stat-label">{s.label}</div>
            <div className="adm-stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <TestimonialsSearch />
      <TestimonialsClient
        testimonials={testimonials.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
          serviceType: t.serviceType ?? null,
        }))}
        total={total}
        page={page}
        totalPages={totalPages}
        filter={filter}
      />
    </>
  );
}
