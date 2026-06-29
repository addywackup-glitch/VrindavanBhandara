import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "FAQs" };

type SearchParams = { search?: string; service?: string };

export default async function AdminFaqsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

  const params = await searchParams;

  const faqs = await prisma.fAQ.findMany({
    where: {
      ...(params.search && {
        OR: [
          { question: { contains: params.search, mode: "insensitive" } },
          { answer: { contains: params.search, mode: "insensitive" } },
        ],
      }),
      ...(params.service && params.service !== "ALL" ? { serviceType: params.service as never } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">FAQs</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            {faqs.length} FAQ entries across all services
          </p>
        </div>
      </div>

      <div className="adm-detail-card" style={{ marginBottom: "1.25rem" }}>
        <div className="adm-detail-card-body" style={{ paddingTop: "1rem", paddingBottom: "1rem" }}>
          <form method="GET">
            <div className="adm-search-wrap" style={{ maxWidth: 480 }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <input name="search" className="adm-search-input" style={{ width: "100%" }} defaultValue={params.search} placeholder="Search questions or answers…" />
            </div>
          </form>
        </div>
      </div>

      <div className="adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              {["Question", "Service", "Category", "Order", "Status"].map((h) => (
                <th key={h} scope="col">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {faqs.map((f) => (
              <tr key={f.id}>
                <td>
                  <div style={{ fontWeight: 500, marginBottom: "0.25rem" }}>{f.question}</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--muted)", lineHeight: 1.5 }}>{f.answer.slice(0, 120)}{f.answer.length > 120 ? "…" : ""}</div>
                </td>
                <td style={{ fontSize: "0.8125rem" }}>{f.serviceType ?? "Global"}</td>
                <td style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{f.category ?? "—"}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>{f.sortOrder}</td>
                <td>
                  <span className={`adm-badge ${f.isActive ? "adm-badge-confirmed" : "adm-badge-cancelled"}`}>
                    {f.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {faqs.length === 0 && (
          <div className="adm-empty"><div className="adm-empty-title">No FAQs found</div></div>
        )}
      </div>
    </>
  );
}
