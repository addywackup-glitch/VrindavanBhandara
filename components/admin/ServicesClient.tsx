"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Trash2, Pencil, ArrowUp, ArrowDown } from "lucide-react";

type Service = {
  id: string;
  name: string;
  slug: string;
  type: string;
  shortDesc: string;
  isActive: boolean;
  sortOrder: number;
  packageCount: number;
  icon: string | null;
};

type Props = {
  services: Service[];
  availableTypes: string[];
};

export function ServicesClient({ services, availableTypes }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function patchService(id: string, data: Record<string, unknown>) {
    setLoadingId(id + JSON.stringify(data));
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed");
      }
      startTransition(() => router.refresh());
    } catch (e) {
      alert(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteService(id: string, name: string, packageCount: number) {
    const msg =
      packageCount > 0
        ? `"${name}" has ${packageCount} package(s). It will be deactivated instead of deleted. Proceed?`
        : `Remove service "${name}"? If delete is not permitted, it will be deactivated.`;
    if (!confirm(msg)) return;

    setLoadingId(id + "delete");
    try {
      // Prefer deactivate when packages exist — avoids hard-delete FK issues.
      if (packageCount > 0) {
        await patchService(id, { isActive: false });
        return;
      }

      const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        // OPERATIONS_ADMIN has write but not delete — fall back to deactivate.
        if (res.status === 403) {
          await patchService(id, { isActive: false });
          return;
        }
        throw new Error(data.error ?? data.message ?? "Delete failed");
      }
      alert(data.data?.message ?? data.message ?? "Done");
      startTransition(() => router.refresh());
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      {availableTypes.length === 0 && (
        <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "1rem" }}>
          All service types are in use. Edit or deactivate an existing service to free a type.
        </p>
      )}

      {services.length === 0 ? (
        <div className="adm-empty">
          <div className="adm-empty-title">No services yet</div>
          <Link href="/admin/services/new" className="adm-link">
            Create your first service →
          </Link>
        </div>
      ) : (
        <div className="adm-table-card">
          <table className="adm-table">
            <thead>
              <tr>
                {["Order", "Service", "Type", "Packages", "Status", "Actions"].map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                      <button
                        type="button"
                        className="adm-action-btn"
                        disabled={loadingId !== null || s.sortOrder <= 0}
                        onClick={() => patchService(s.id, { sortOrder: Math.max(0, s.sortOrder - 1) })}
                        aria-label="Move up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", minWidth: 20 }}>
                        {s.sortOrder}
                      </span>
                      <button
                        type="button"
                        className="adm-action-btn"
                        disabled={loadingId !== null}
                        onClick={() => patchService(s.id, { sortOrder: s.sortOrder + 1 })}
                        aria-label="Move down"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {s.icon ? <span style={{ marginRight: 6 }}>{s.icon}</span> : null}
                      {s.name}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: 2 }}>
                      /{s.slug}
                    </div>
                  </td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{s.type}</td>
                  <td>{s.packageCount}</td>
                  <td>
                    <span className={`adm-badge ${s.isActive ? "adm-badge-confirmed" : "adm-badge-cancelled"}`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      <Link href={`/admin/services/${s.id}/edit`} className="adm-action-btn" title="Edit">
                        <Pencil size={14} />
                      </Link>
                      <Link href={`/services/${s.slug}`} target="_blank" className="adm-action-btn" title="Preview">
                        Preview
                      </Link>
                      <button
                        type="button"
                        className="adm-action-btn"
                        disabled={loadingId !== null}
                        onClick={() => patchService(s.id, { isActive: !s.isActive })}
                        title={s.isActive ? "Deactivate" : "Activate"}
                      >
                        {s.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        type="button"
                        className="adm-action-btn"
                        disabled={loadingId !== null}
                        onClick={() => deleteService(s.id, s.name, s.packageCount)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
