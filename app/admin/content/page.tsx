import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Content Management" };

async function getContentData() {
  const [faqs, testimonials, packages] = await Promise.all([
    prisma.fAQ.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.testimonial.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.package.findMany({
      include: { serviceCategory: true, _count: { select: { bookings: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { faqs, testimonials, packages };
}

export default async function AdminContentPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

  const { faqs, testimonials, packages } = await getContentData();

  const fmt = (n: unknown) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-800">Content Management</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage FAQs, testimonials, and service packages</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Service Packages */}
        <div className="rounded-2xl" style={{ background: "white", border: "1px solid rgba(212,175,55,0.1)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          <div className="p-5 border-b border-gray-50">
            <h2 className="font-heading font-bold text-gray-800">Service Packages ({packages.length})</h2>
          </div>
          <div className="p-3 max-h-80 overflow-y-auto">
            {packages.map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-amber-50/30 transition-colors">
                <div>
                  <p className="text-xs font-semibold text-gray-800">{pkg.name}</p>
                  <p className="text-[10px] text-gray-400">{pkg.serviceCategory.name} · {pkg._count.bookings} bookings</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold" style={{ color: "#D4AF37" }}>{fmt(pkg.price)}</p>
                  <span className={`text-[10px] font-semibold ${pkg.isActive ? "text-green-600" : "text-red-400"}`}>
                    {pkg.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="rounded-2xl" style={{ background: "white", border: "1px solid rgba(212,175,55,0.1)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          <div className="p-5 border-b border-gray-50">
            <h2 className="font-heading font-bold text-gray-800">Testimonials ({testimonials.length})</h2>
          </div>
          <div className="p-3 max-h-80 overflow-y-auto">
            {testimonials.map((t) => (
              <div key={t.id} className="p-3 rounded-xl hover:bg-amber-50/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-800">{t.name}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="text-[10px]" style={{ color: i < t.rating ? "#D4AF37" : "#E5E7EB" }}>★</span>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 line-clamp-2">{t.comment}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] font-semibold ${t.isApproved ? "text-green-600" : "text-yellow-600"}`}>
                    {t.isApproved ? "✓ Approved" : "⏳ Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="lg:col-span-2 rounded-2xl" style={{ background: "white", border: "1px solid rgba(212,175,55,0.1)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          <div className="p-5 border-b border-gray-50">
            <h2 className="font-heading font-bold text-gray-800">FAQs ({faqs.length})</h2>
          </div>
          <div className="p-3 max-h-72 overflow-y-auto">
            {faqs.map((faq) => (
              <div key={faq.id} className="p-3 rounded-xl hover:bg-amber-50/30 transition-colors border-b border-gray-50 last:border-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800">{faq.question}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{faq.answer}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 whitespace-nowrap flex-shrink-0">
                    {faq.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-5 p-4 rounded-xl text-sm text-gray-500" style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)" }}>
        💡 Full CRUD editing for packages, FAQs, and testimonials will be available in Phase 3. For now, you can manage records directly via the database or API.
      </div>
    </div>
  );
}
