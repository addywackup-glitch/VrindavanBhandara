import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = { title: "Media Proofs" };

type SearchParams = { type?: string; page?: string; search?: string };

async function getProofs({ type, page, search }: SearchParams) {
  const p = Math.max(1, Number(page ?? 1));
  const pageSize = 24;

  const where = {
    ...(type && type !== "ALL" && { type: type as never }),
    ...(search && {
      OR: [
        { caption: { contains: search, mode: "insensitive" as const } },
        { booking: { bookingNumber: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [proofs, total] = await Promise.all([
    prisma.mediaProof.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (p - 1) * pageSize,
      take: pageSize,
      include: {
        booking: {
          select: {
            bookingNumber: true,
            id: true,
            user: { select: { name: true } },
          },
        },
      },
    }),
    prisma.mediaProof.count({ where }),
  ]);

  return { proofs, total, page: p, totalPages: Math.ceil(total / pageSize) };
}

export default async function ProofsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const filterType = params.type ?? "ALL";
  const { proofs, total, page, totalPages } = await getProofs(params);

  const [photoCount, videoCount, docCount] = await Promise.all([
    prisma.mediaProof.count({ where: { type: "PHOTO" } }),
    prisma.mediaProof.count({ where: { type: "VIDEO" } }),
    prisma.mediaProof.count({ where: { type: "DOCUMENT" } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Media Proofs</h1>
        <p className="text-gray-500 text-sm mt-1">{total} proof files across all bookings.</p>
      </div>

      {/* Type stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Photos", count: photoCount, emoji: "📷", type: "PHOTO" },
          { label: "Videos", count: videoCount, emoji: "🎥", type: "VIDEO" },
          { label: "Documents", count: docCount, emoji: "📄", type: "DOCUMENT" },
        ].map((s) => (
          <Link
            key={s.type}
            href={`?type=${s.type}`}
            className="bg-white rounded-2xl border p-4 flex items-center gap-4 transition-shadow hover:shadow-md"
            style={{ borderColor: filterType === s.type ? "rgba(139,30,30,0.4)" : "rgba(212,175,55,0.1)" }}
          >
            <span className="text-3xl">{s.emoji}</span>
            <div>
              <p className="text-xl font-bold text-gray-800">{s.count}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-3 mb-6">
        {["ALL", "PHOTO", "VIDEO", "DOCUMENT"].map((t) => (
          <Link
            key={t}
            href={`?type=${t}`}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{
              background: filterType === t ? "#8B1E1E" : "#F5EEDB",
              color: filterType === t ? "white" : "#5A3E2B",
            }}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {proofs.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
          <div className="text-5xl mb-4">📁</div>
          <h3 className="font-semibold text-gray-700 mb-2">No proofs found</h3>
          <p className="text-gray-400 text-sm">Upload proof media from individual booking pages.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {proofs.map((proof) => (
            <div
              key={proof.id}
              className="relative group rounded-xl overflow-hidden bg-gray-100 border"
              style={{ aspectRatio: "1", borderColor: "rgba(212,175,55,0.1)" }}
            >
              {proof.type === "PHOTO" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={proof.url}
                  alt={proof.caption ?? "Proof"}
                  className="w-full h-full object-cover"
                />
              ) : proof.type === "VIDEO" ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <span className="text-3xl">🎥</span>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-50">
                  <span className="text-3xl">📄</span>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                <Link
                  href={`/admin/bookings/${proof.bookingId}`}
                  className="text-white text-[10px] font-bold text-center leading-tight hover:underline"
                >
                  {proof.booking.bookingNumber}
                </Link>
                <p className="text-gray-300 text-[9px] truncate w-full text-center">{proof.booking.user.name}</p>
                <a
                  href={proof.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-[10px] bg-white/20 text-white px-2 py-0.5 rounded hover:bg-white/30"
                >
                  View
                </a>
              </div>

              {/* Caption badge */}
              {proof.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5">
                  <p className="text-[9px] text-white truncate">{proof.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-8">
          {page > 1 && (
            <Link href={`?type=${filterType}&page=${page - 1}`} className="px-4 py-2 text-xs rounded-lg bg-amber-50 text-amber-800 font-semibold">
              ← Prev
            </Link>
          )}
          <span className="px-4 py-2 text-xs text-gray-400">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`?type=${filterType}&page=${page + 1}`} className="px-4 py-2 text-xs rounded-lg bg-amber-50 text-amber-800 font-semibold">
              Next →
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
        <strong>Upload proofs:</strong> Go to a specific booking page to upload photos, videos, or documents.
        Drag-and-drop multi-upload with Cloudflare R2 integration is planned for Phase 2.
      </div>
    </div>
  );
}
