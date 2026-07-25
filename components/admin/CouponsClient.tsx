"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2, Pencil, Plus, X } from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number | string;
  minOrderValue: number | string | null;
  maxDiscount: number | string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | Date | null;
};

type FormState = {
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: string;
  minOrderValue: string;
  maxDiscount: string;
  maxUses: string;
  isActive: boolean;
  expiresAt: string;
};

const emptyForm = (): FormState => ({
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minOrderValue: "",
  maxDiscount: "",
  maxUses: "",
  isActive: true,
  expiresAt: "",
});

function num(v: number | string | null | undefined) {
  if (v === null || v === undefined) return "—";
  return String(v);
}

type Props = { coupons: Coupon[] };

export function CouponsClient({ coupons }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setShowForm(true);
  }

  function openEdit(c: Coupon) {
    setEditingId(c.id);
    setForm({
      code: c.code,
      description: c.description ?? "",
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minOrderValue: c.minOrderValue != null ? String(c.minOrderValue) : "",
      maxDiscount: c.maxDiscount != null ? String(c.maxDiscount) : "",
      maxUses: c.maxUses != null ? String(c.maxUses) : "",
      isActive: c.isActive,
      expiresAt: c.expiresAt
        ? new Date(c.expiresAt).toISOString().slice(0, 10)
        : "",
    });
    setError("");
    setShowForm(true);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        isActive: form.isActive,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        applicableServices: [],
        applicablePackages: [],
      };

      const url = editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to save coupon");
        return;
      }
      setShowForm(false);
      startTransition(() => router.refresh());
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c: Coupon) {
    setLoadingId(c.id);
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to update");
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setLoadingId(null);
    }
  }

  async function remove(c: Coupon) {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    setLoadingId(c.id);
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to delete");
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      {error && <div className="adm-alert adm-alert-error" role="alert" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <button type="button" className="adm-topbar-btn" onClick={openCreate}>
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {showForm && (
        <div className="adm-detail-card" style={{ marginBottom: "1.25rem" }}>
          <div className="adm-detail-card-header" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{editingId ? "Edit Coupon" : "Create Coupon"}</span>
            <button type="button" className="adm-filter-btn" onClick={() => setShowForm(false)} aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <div className="adm-detail-card-body" style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <label className="adm-label">Code</label>
              <input className="adm-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="DIWALI10" />
            </div>
            <div>
              <label className="adm-label">Type</label>
              <select className="adm-select" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as "PERCENTAGE" | "FLAT" })}>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FLAT">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="adm-label">Discount value</label>
              <input className="adm-input" type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
            </div>
            <div>
              <label className="adm-label">Max uses (blank = unlimited)</label>
              <input className="adm-input" type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
            </div>
            <div>
              <label className="adm-label">Min order (₹)</label>
              <input className="adm-input" type="number" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} />
            </div>
            <div>
              <label className="adm-label">Max discount (₹, % only)</label>
              <input className="adm-input" type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
            </div>
            <div>
              <label className="adm-label">Expires</label>
              <input className="adm-input" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
            <div style={{ display: "flex", alignItems: "end", gap: "0.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Active
              </label>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="adm-label">Description</label>
              <input className="adm-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <button type="button" className="adm-topbar-btn" onClick={save} disabled={saving}>
                {saving ? "Saving…" : editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Uses</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: "var(--muted)" }}>No coupons yet.</td>
              </tr>
            )}
            {coupons.map((c) => (
              <tr key={c.id}>
                <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{c.code}</td>
                <td>
                  {c.discountType === "PERCENTAGE"
                    ? `${num(c.discountValue)}%`
                    : `₹${num(c.discountValue)}`}
                </td>
                <td>
                  {c.usedCount}
                  {c.maxUses != null ? ` / ${c.maxUses}` : " / ∞"}
                </td>
                <td>
                  {c.expiresAt
                    ? new Date(c.expiresAt).toLocaleDateString("en-IN")
                    : "—"}
                </td>
                <td>
                  <span className={`adm-badge ${c.isActive ? "adm-badge-confirmed" : "adm-badge-refunded"}`}>
                    {c.isActive ? "Active" : "Off"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.375rem" }}>
                    <button type="button" className="adm-filter-btn" onClick={() => openEdit(c)} disabled={loadingId === c.id} aria-label="Edit">
                      <Pencil size={14} />
                    </button>
                    <button type="button" className="adm-filter-btn" onClick={() => toggleActive(c)} disabled={loadingId === c.id} aria-label="Toggle">
                      {c.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button type="button" className="adm-filter-btn" onClick={() => remove(c)} disabled={loadingId === c.id} aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
