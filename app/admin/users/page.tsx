import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "User Management" };

type SearchParams = { search?: string; page?: string };

async function getUsers({ search, page }: SearchParams) {
  const p = Math.max(1, Number(page ?? 1));
  const pageSize = 25;
  const skip = (p - 1) * pageSize;

  const where = {
    role: "CUSTOMER" as never,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as never } },
        { email: { contains: search, mode: "insensitive" as never } },
        { phone: { contains: search, mode: "insensitive" as never } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        _count: { select: { bookings: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page: p, totalPages: Math.ceil(total / pageSize) };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;
  const { users, total, page, totalPages } = await getUsers(params);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-800">Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total.toLocaleString("en-IN")} registered customers</p>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl p-4 mb-5" style={{ background: "white", border: "1px solid rgba(212,175,55,0.1)" }}>
        <form method="GET" className="flex gap-3">
          <input
            name="search"
            defaultValue={params.search}
            placeholder="Search by name, email, or phone..."
            className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-300 text-gray-700"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #D4AF37, #FF7722)" }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid rgba(212,175,55,0.08)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#FAFAF8" }}>
                {["Name", "Email", "Phone", "Bookings", "Joined", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-gray-50 hover:bg-amber-50/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #D4AF37, #FF7722)" }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-800 text-xs">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{user.email}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{user.phone ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-gray-700 text-xs">{user._count.bookings}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${user.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/bookings?search=${encodeURIComponent(user.email)}`}
                      className="text-[11px] font-semibold text-yellow-600 hover:text-orange-500 flex items-center gap-1"
                    >
                      Bookings <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="py-20 text-center text-gray-400 text-sm">No users found</div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-50">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/users?page=${page - 1}${params.search ? `&search=${params.search}` : ""}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200">
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/users?page=${page + 1}${params.search ? `&search=${params.search}` : ""}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #D4AF37, #FF7722)" }}>
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
