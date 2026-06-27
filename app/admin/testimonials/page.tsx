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

  // Stats
  const [totalPending, totalApproved, totalFeatured] = await Promise.all([
    prisma.testimonial.count({ where: { isApproved: false } }),
    prisma.testimonial.count({ where: { isApproved: true } }),
    prisma.testimonial.count({ where: { isFeatured: true } }),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Testimonials</h1>
          <p className="text-gray-500 text-sm mt-1">Moderate and feature customer reviews.</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pending Review", count: totalPending, color: "#b45309", bg: "#fffbeb" },
          { label: "Approved", count: totalApproved, color: "#15803d", bg: "#f0fdf4" },
          { label: "Featured", count: totalFeatured, color: "#B89947", bg: "#fefce8" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-4 border text-center"
            style={{ borderColor: "rgba(212,175,55,0.1)" }}
          >
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {s.count}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
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
    </div>
  );
}
