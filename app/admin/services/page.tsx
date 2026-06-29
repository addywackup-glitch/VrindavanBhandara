import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = { title: "Services" };

export default async function AdminServicesPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");

  const services = await prisma.serviceCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { packages: true } },
    },
  });

  return (
    <>
      <div className="adm-section-header">
        <div>
          <div className="adm-section-title">Services</div>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Service catalog and page metadata. Content is stored in ServiceCategory.pageSections.
          </p>
        </div>
      </div>

      <div className="adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              {["Service", "Slug", "Type", "Packages", "Status", "Public Page"].map((h) => (
                <th key={h} scope="col">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", color: "var(--brand)" }}>{s.slug}</td>
                <td style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{s.type}</td>
                <td>{s._count.packages}</td>
                <td>
                  <span className={`adm-badge ${s.isActive ? "adm-badge-confirmed" : "adm-badge-cancelled"}`}>
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <Link href={`/services/${s.slug}`} target="_blank" className="adm-action-btn">Preview</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="adm-detail-card" style={{ marginTop: "1.25rem" }}>
        <div className="adm-detail-card-header">Page Sections Preview</div>
        <div className="adm-detail-card-body">
          {services.map((s) => (
            <div key={s.id} style={{ marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 600, marginBottom: "0.375rem" }}>{s.name}</div>
              <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "0.5rem" }}>{s.shortDesc}</p>
              {s.pageSections ? (
                <pre style={{ fontSize: "0.75rem", background: "var(--n-50)", padding: "0.875rem", borderRadius: "var(--radius-sm)", overflow: "auto", maxHeight: 160 }}>
                  {JSON.stringify(s.pageSections, null, 2)}
                </pre>
              ) : (
                <span style={{ fontSize: "0.8125rem", color: "var(--subtle)" }}>No custom pageSections — using UI defaults</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
