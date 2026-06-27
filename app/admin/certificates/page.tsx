import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Download, Shield, Copy, BookOpen, RefreshCcw } from "lucide-react";

export const metadata: Metadata = { title: "Certificates" };

type SearchParams = { page?: string; search?: string };

async function getCertificates({ page, search }: SearchParams) {
  const p = Math.max(1, Number(page ?? 1));
  const pageSize = 20;

  const where = search
    ? {
        OR: [
          { verifyCode: { contains: search, mode: "insensitive" as const } },
          { booking: { bookingNumber: { contains: search, mode: "insensitive" as const } } },
          { booking: { user: { name: { contains: search, mode: "insensitive" as const } } } },
        ],
      }
    : {};

  const [certificates, total] = await Promise.all([
    prisma.certificate.findMany({
      where,
      orderBy: { generatedAt: "desc" },
      skip: (p - 1) * pageSize,
      take: pageSize,
      include: {
        booking: {
          include: {
            user: { select: { name: true, email: true } },
            package: { include: { serviceCategory: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.certificate.count({ where }),
  ]);

  return { certificates, total, page: p, totalPages: Math.ceil(total / pageSize) };
}

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const { certificates, total, page, totalPages } = await getCertificates(params);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vrindavanbhandara.com";

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Certificates</h1>
          <p className="text-gray-500 text-sm mt-1">{total} certificates generated.</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form className="relative max-w-sm">
          <input
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search by booking or verify code…"
            className="w-full pl-4 pr-10 py-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2"
            style={{ borderColor: "rgba(212,175,55,0.2)" }}
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            ↵
          </button>
        </form>
      </div>

      {certificates.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
          <div className="text-5xl mb-4">📜</div>
          <h3 className="font-semibold text-gray-700 mb-2">No certificates yet</h3>
          <p className="text-gray-400 text-sm">Certificates are generated when bookings are marked Completed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(212,175,55,0.08)", background: "#FDFAF5" }}>
                {["Booking", "Customer", "Service", "Verify Code", "Downloads", "Generated", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert) => (
                <tr key={cert.id} className="border-t hover:bg-amber-50/20 transition-colors" style={{ borderColor: "rgba(212,175,55,0.06)" }}>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/bookings/${cert.bookingId}`} className="font-mono text-xs text-blue-600 hover:underline">
                      {cert.booking.bookingNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-800">{cert.booking.user.name}</p>
                    <p className="text-xs text-gray-400">{cert.booking.user.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {cert.booking.package.serviceCategory.name}
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="text-xs bg-amber-50 border border-amber-100 px-2 py-0.5 rounded font-mono text-amber-800">
                      {cert.verifyCode}
                    </code>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 text-center">{cert.downloadCount}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {cert.generatedAt.toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <a
                        href={cert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Download"
                      >
                        <Download size={14} />
                      </a>
                      <a
                        href={`${siteUrl}/certificate/${cert.verifyCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                        title="Verify"
                      >
                        <Shield size={14} />
                      </a>
                      <button
                        onClick={() => navigator.clipboard.writeText(`${siteUrl}/certificate/${cert.verifyCode}`)}
                        className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 transition-colors"
                        title="Copy verify URL"
                      >
                        <Copy size={14} />
                      </button>
                      <Link
                        href={`/admin/bookings/${cert.bookingId}`}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                        title="View booking"
                      >
                        <BookOpen size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t px-5 py-4 flex items-center justify-between" style={{ borderColor: "rgba(212,175,55,0.08)" }}>
              <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`?page=${page - 1}`} className="px-3 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-800 font-semibold">
                    ← Prev
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`?page=${page + 1}`} className="px-3 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-800 font-semibold">
                    Next →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Note about regeneration */}
      <div className="mt-6 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <RefreshCcw size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          <strong>Regeneration:</strong> To regenerate a certificate, update the booking to Completed again from the booking detail page.
          The certificate regeneration endpoint will be available in Phase 2 when R2 PDF generation is integrated.
        </p>
      </div>
    </div>
  );
}
