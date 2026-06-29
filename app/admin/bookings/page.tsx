import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminBookingsTable } from "@/components/admin/AdminBookingsTable";
import type { BookingStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Bookings" };

type SearchParams = { status?: string; search?: string; page?: string };

async function getBookings({ status, search, page }: SearchParams) {
  const p = Math.max(1, Number(page ?? 1));
  const pageSize = 20;
  const skip = (p - 1) * pageSize;

  const where = {
    ...(status && status !== "ALL" ? { status: status as BookingStatus } : {}),
    ...(search && {
      OR: [
        { bookingNumber: { contains: search, mode: "insensitive" as const } },
        { user: { name: { contains: search, mode: "insensitive" as const } } },
        { user: { email: { contains: search, mode: "insensitive" as const } } },
        { user: { phone: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [bookings, total, tabCounts] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        package: { include: { serviceCategory: true } },
        payment: { select: { status: true, amount: true } },
      },
    }),
    prisma.booking.count({ where }),
    prisma.booking.groupBy({ by: ["status"], _count: { id: true } }),
  ]);

  const counts: Record<string, number> = { ALL: 0 };
  tabCounts.forEach((c) => {
    counts[c.status] = c._count.id;
    counts.ALL += c._count.id;
  });

  return { bookings, total, page: p, totalPages: Math.ceil(total / pageSize), counts };
}

const STATUS_TABS = ["ALL", "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REFUNDED"] as const;

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const { bookings, total, page, totalPages, counts } = await getBookings(params);
  const activeStatus = (params.status ?? "ALL").toUpperCase();

  const buildTabHref = (status: string) => {
    const q = new URLSearchParams();
    if (status !== "ALL") q.set("status", status);
    if (params.search) q.set("search", params.search);
    const s = q.toString();
    return `/admin/bookings${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">Bookings</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            {total.toLocaleString("en-IN")} total bookings
          </p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="adm-detail-card" style={{ marginBottom: "1.25rem" }}>
        <div className="adm-detail-card-body" style={{ paddingTop: "1rem", paddingBottom: "1rem" }}>
          <form method="GET" style={{ marginBottom: "0.875rem" }}>
            <div className="adm-search-wrap" style={{ maxWidth: 480 }}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                name="search"
                className="adm-search-input"
                style={{ width: "100%" }}
                defaultValue={params.search}
                placeholder="Search by booking #, name, email, phone…"
                aria-label="Search bookings"
              />
            </div>
            {params.status && <input type="hidden" name="status" value={params.status} />}
          </form>
          <div className="adm-filter-row">
            {STATUS_TABS.map((s) => (
              <Link
                key={s}
                href={buildTabHref(s)}
                className={`adm-filter-btn${activeStatus === s ? " active" : ""}`}
              >
                {s.replace("_", " ")}
                {counts[s] !== undefined && counts[s] > 0 ? ` (${counts[s]})` : ""}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <AdminBookingsTable
        bookings={bookings.map((b) => ({
          id: b.id,
          bookingNumber: b.bookingNumber,
          status: b.status,
          sevaDate: b.sevaDate.toISOString(),
          createdAt: b.createdAt.toISOString(),
          user: b.user,
          package: b.package,
          payment: b.payment ? { status: b.payment.status, amount: Number(b.payment.amount) } : null,
        }))}
        page={page}
        totalPages={totalPages}
        activeStatus={activeStatus}
        search={params.search}
      />
    </>
  );
}
