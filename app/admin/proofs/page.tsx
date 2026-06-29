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
    <>
      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">Proof Uploads</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            {total} proof files across all bookings
          </p>
        </div>
      </div>

      <div className="adm-stats-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {[
          { label: "Photos", value: photoCount, type: "PHOTO" },
          { label: "Videos", value: videoCount, type: "VIDEO" },
          { label: "Documents", value: docCount, type: "DOCUMENT" },
        ].map((s) => (
          <Link key={s.type} href={`?type=${s.type}`} className="adm-stat-card" style={{ textDecoration: "none" }}>
            <div className="adm-stat-label">{s.label}</div>
            <div className="adm-stat-value">{s.value}</div>
          </Link>
        ))}
      </div>

      <div className="adm-filter-row" style={{ marginBottom: "1.25rem" }}>
        {["ALL", "PHOTO", "VIDEO", "DOCUMENT"].map((t) => (
          <Link key={t} href={`?type=${t}`} className={`adm-filter-btn${filterType === t ? " active" : ""}`}>
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {proofs.length === 0 ? (
        <div className="adm-empty">
          <div className="adm-empty-title">No proofs found</div>
          <p className="adm-empty-desc">Upload proof media from individual booking pages.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem" }}>
          {proofs.map((proof) => (
            <div
              key={proof.id}
              style={{
                position: "relative",
                aspectRatio: "1",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                border: "1.5px solid var(--border)",
                background: "var(--n-100)",
              }}
              className="group"
            >
              {proof.type === "PHOTO" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={proof.url} alt={proof.caption ?? "Proof"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", background: "var(--n-800)", color: "white", fontSize: "1.5rem" }}>
                  {proof.type === "VIDEO" ? "▶" : "📄"}
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.65)",
                  opacity: 0,
                  transition: "opacity 150ms",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.25rem",
                  padding: "0.5rem",
                }}
                className="group-hover:opacity-100"
              >
                <Link href={`/admin/bookings/${proof.bookingId}`} className="adm-link" style={{ color: "white", fontSize: "0.6875rem", fontWeight: 600 }}>
                  {proof.booking.bookingNumber}
                </Link>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.625rem" }}>{proof.booking.user.name}</span>
                <a href={proof.url} target="_blank" rel="noopener noreferrer" className="adm-action-btn" style={{ marginTop: "0.25rem", fontSize: "0.6875rem" }}>
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="adm-pagination" style={{ marginTop: "1.25rem", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
          <p className="adm-pagination-info">Page {page} of {totalPages}</p>
          <div className="adm-filter-row">
            {page > 1 && <Link href={`?type=${filterType}&page=${page - 1}`} className="adm-filter-btn">Previous</Link>}
            {page < totalPages && <Link href={`?type=${filterType}&page=${page + 1}`} className="adm-filter-btn active">Next</Link>}
          </div>
        </div>
      )}

      <div className="adm-alert adm-alert-success" style={{ marginTop: "1.25rem" }}>
        Upload proofs from a booking detail page. Use the booking actions panel to add photos and videos.
      </div>
    </>
  );
}
