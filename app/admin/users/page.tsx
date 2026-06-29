import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatAdminDate } from "@/lib/admin-ui";

export const metadata: Metadata = { title: "Customers" };

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
      include: { _count: { select: { bookings: true } } },
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
    <>
      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">Customers</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            {total.toLocaleString("en-IN")} registered customers
          </p>
        </div>
      </div>

      <div className="adm-detail-card" style={{ marginBottom: "1.25rem" }}>
        <div className="adm-detail-card-body" style={{ paddingTop: "1rem", paddingBottom: "1rem" }}>
          <form method="GET">
            <div className="adm-search-wrap" style={{ maxWidth: 480 }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <input
                name="search"
                className="adm-search-input"
                style={{ width: "100%" }}
                defaultValue={params.search}
                placeholder="Search by name, email, phone, or booking #…"
                aria-label="Search customers"
              />
            </div>
          </form>
        </div>
      </div>

      <div className="adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              {["Customer", "Email", "Phone", "Bookings", "Joined", "Status", ""].map((h) => (
                <th key={h || "action"} scope="col">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div className="adm-profile-avatar" style={{ width: 32, height: 32, fontSize: "0.75rem" }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600 }}>{user.name}</span>
                  </div>
                </td>
                <td style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>{user.email}</td>
                <td style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>{user.phone ?? "—"}</td>
                <td style={{ fontWeight: 600 }}>{user._count.bookings}</td>
                <td style={{ color: "var(--muted)", fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
                  {formatAdminDate(user.createdAt)}
                </td>
                <td>
                  <span className={`adm-badge ${user.isActive ? "adm-badge-confirmed" : "adm-badge-cancelled"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <Link href={`/admin/users/${user.id}`} className="adm-action-btn">View Profile</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="adm-empty"><div className="adm-empty-title">No customers found</div></div>
        )}
        {totalPages > 1 && (
          <div className="adm-pagination">
            <p className="adm-pagination-info">Page {page} of {totalPages}</p>
            <div className="adm-filter-row">
              {page > 1 && (
                <Link href={`/admin/users?page=${page - 1}${params.search ? `&search=${params.search}` : ""}`} className="adm-filter-btn">
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/users?page=${page + 1}${params.search ? `&search=${params.search}` : ""}`} className="adm-filter-btn active">
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
