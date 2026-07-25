"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminRole } from "@prisma/client";

type AdminRow = {
  id: string;
  role: AdminRole;
  isActive: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

const ROLES: AdminRole[] = [
  "SUPER_ADMIN",
  "OPERATIONS_ADMIN",
  "CONTENT_ADMIN",
  "SUPPORT_ADMIN",
];

const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  OPERATIONS_ADMIN: "Operations",
  CONTENT_ADMIN: "Content",
  SUPPORT_ADMIN: "Support",
};

type Props = { admins: AdminRow[]; currentUserId: string };

export function RolesClient({ admins, currentUserId }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("OPERATIONS_ADMIN");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  async function promote() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to promote user");
        return;
      }
      setEmail("");
      setSuccess(`Promoted ${data.data.user.email} to ${ROLE_LABELS[data.data.role as AdminRole]}`);
      startTransition(() => router.refresh());
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: { role?: AdminRole; isActive?: boolean }) {
    setRowBusy(id);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to update admin");
        return;
      }
      setSuccess("Admin updated");
      startTransition(() => router.refresh());
    } catch {
      setError("Network error");
    } finally {
      setRowBusy(null);
    }
  }

  return (
    <div style={{ marginBottom: "1.75rem" }}>
      {error && <div className="adm-alert adm-alert-error" role="alert" style={{ marginBottom: "1rem" }}>{error}</div>}
      {success && <div className="adm-alert adm-alert-success" role="status" style={{ marginBottom: "1rem" }}>{success}</div>}

      <div className="adm-detail-card" style={{ marginBottom: "1.25rem" }}>
        <div className="adm-detail-card-header">Add admin</div>
        <div className="adm-detail-card-body" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
          <div style={{ flex: "1 1 220px" }}>
            <label className="adm-label" htmlFor="promote-email">Customer email</label>
            <input
              id="promote-email"
              className="adm-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="devotee@example.com"
            />
          </div>
          <div style={{ flex: "0 1 180px" }}>
            <label className="adm-label" htmlFor="promote-role">Role</label>
            <select
              id="promote-role"
              className="adm-select"
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <button type="button" className="adm-topbar-btn" onClick={promote} disabled={busy || !email.trim()}>
            {busy ? "Adding…" : "Promote to admin"}
          </button>
        </div>
      </div>

      <div className="adm-table-card">
        <div className="adm-detail-card-header">Admins</div>
        <table className="adm-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600 }}>
                  {a.user.name}
                  {a.user.id === currentUserId ? (
                    <span style={{ color: "var(--muted)", fontWeight: 400 }}> (you)</span>
                  ) : null}
                </td>
                <td style={{ fontSize: "0.8125rem" }}>{a.user.email}</td>
                <td>
                  <select
                    className="adm-select"
                    value={a.role}
                    disabled={rowBusy === a.id}
                    onChange={(e) => patch(a.id, { role: e.target.value as AdminRole })}
                    aria-label={`Role for ${a.user.name}`}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className={`adm-badge ${a.isActive ? "adm-badge-confirmed" : "adm-badge-refunded"}`}>
                    {a.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="adm-filter-btn"
                    disabled={rowBusy === a.id}
                    onClick={() => patch(a.id, { isActive: !a.isActive })}
                  >
                    {a.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
