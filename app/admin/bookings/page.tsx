import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";

export const metadata: Metadata = { title: "Bookings Management" };

type SearchParams = { status?: string; search?: string; page?: string };

async function getBookings({ status, search, page }: SearchParams) {
  const p = Math.max(1, Number(page ?? 1));
  const pageSize = 20;
  const skip = (p - 1) * pageSize;

  const where = {
    ...(status && status !== "ALL" && { status: status as never }),
    ...(search && {
      OR: [
        { bookingNumber: { contains: search, mode: "insensitive" as never } },
        { user: { name: { contains: search, mode: "insensitive" as never } } },
        { user: { email: { contains: search, mode: "insensitive" as never } } },
      ],
    }),
  };

  const [bookings, total] = await Promise.all([
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
  ]);

  return { bookings, total, page: p, totalPages: Math.ceil(total / pageSize) };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  CONFIRMED: { label: "Confirmed", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  IN_PROGRESS: { label: "In Progress", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  COMPLETED: { label: "Completed", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  CANCELLED: { label: "Cancelled", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

const STATUS_TABS = ["ALL", "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const { bookings, total, page, totalPages } = await getBookings(params);
  const activeStatus = params.status ?? "ALL";

  const fmt = (n: unknown) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-800">Bookings</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString("en-IN")} total bookings</p>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl p-4 mb-5"
        style={{ background: "white", border: "1px solid rgba(212,175,55,0.1)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <form method="GET" className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              name="search"
              defaultValue={params.search}
              placeholder="Search by booking #, name, or email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-300 text-gray-700"
            />
            {params.status && <input type="hidden" name="status" value={params.status} />}
          </form>
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-2 mt-3">
          {STATUS_TABS.map((s) => (
            <Link
              key={s}
              href={`/admin/bookings?status=${s}${params.search ? `&search=${params.search}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeStatus === s
                  ? "text-white"
                  : "text-gray-500 bg-gray-100 hover:bg-gray-200"
              }`}
              style={activeStatus === s ? { background: "linear-gradient(135deg, #D4AF37, #FF7722)" } : {}}
            >
              {s.replace("_", " ")}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid rgba(212,175,55,0.08)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#FAFAF8" }}>
                {["Booking #", "Customer", "Service", "Seva Date", "Amount", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const sc = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG["PENDING"];
                return (
                  <tr key={booking.id} className="border-t border-gray-50 hover:bg-amber-50/20 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">{booking.bookingNumber}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-800 text-xs">{booking.user.name}</p>
                      <p className="text-[10px] text-gray-400">{booking.user.email}</p>
                      {booking.user.phone && <p className="text-[10px] text-gray-400">{booking.user.phone}</p>}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600 max-w-[140px] truncate">{booking.package.serviceCategory.name}</td>
                    <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(booking.sevaDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-gray-700">
                      {booking.payment ? fmt(booking.payment.amount) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg text-white"
                        style={{ background: "linear-gradient(135deg, #D4AF37, #FF7722)" }}
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {bookings.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-400 text-sm">No bookings found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-50">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/bookings?page=${page - 1}${activeStatus !== "ALL" ? `&status=${activeStatus}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/bookings?page=${page + 1}${activeStatus !== "ALL" ? `&status=${activeStatus}` : ""}${params.search ? `&search=${params.search}` : ""}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #D4AF37, #FF7722)" }}
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
