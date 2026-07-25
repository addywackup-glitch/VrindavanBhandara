"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2, Pencil, Plus, X } from "lucide-react";

const SERVICE_TYPES = [
  "BHANDARA",
  "BRAHMIN_BHOJ",
  "GAU_SEVA",
  "SADHU_BHOJAN",
  "FESTIVAL_SEVA",
  "ANNADAN_SEVA",
  "VIDHWA_SEVA",
] as const;

type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  serviceType: string | null;
  sortOrder: number;
  isActive: boolean;
  location: string | null;
};

type FormState = {
  question: string;
  answer: string;
  category: string;
  serviceType: string;
  sortOrder: number;
  isActive: boolean;
  location: string;
};

const emptyForm = (): FormState => ({
  question: "",
  answer: "",
  category: "General",
  serviceType: "",
  sortOrder: 0,
  isActive: true,
  location: "",
});

type Props = {
  faqs: Faq[];
};

export function FaqsClient({ faqs }: Props) {
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

  function openEdit(faq: Faq) {
    setEditingId(faq.id);
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      serviceType: faq.serviceType ?? "",
      sortOrder: faq.sortOrder,
      isActive: faq.isActive,
      location: faq.location ?? "",
    });
    setError("");
    setShowForm(true);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        category: form.category.trim() || "General",
        serviceType: form.serviceType || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        location: form.location || null,
      };

      const url = editingId ? `/api/admin/faqs/${editingId}` : "/api/admin/faqs";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.message ?? "Save failed");

      setShowForm(false);
      setEditingId(null);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    setLoadingId(id + "active");
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      startTransition(() => router.refresh());
    } catch {
      alert("Update failed");
    } finally {
      setLoadingId(null);
    }
  }

  async function remove(id: string, question: string) {
    if (!confirm(`Delete FAQ "${question.slice(0, 60)}…"?`)) return;
    setLoadingId(id + "delete");
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      startTransition(() => router.refresh());
    } catch {
      alert("Delete failed");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        {!showForm ? (
          <button type="button" className="adm-topbar-btn" onClick={openCreate}>
            <Plus size={16} style={{ marginRight: 6 }} />
            New FAQ
          </button>
        ) : (
          <div className="adm-detail-card">
            <div className="adm-detail-card-header" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{editingId ? "Edit FAQ" : "New FAQ"}</span>
              <button type="button" className="adm-action-btn" onClick={() => setShowForm(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="adm-detail-card-body" style={{ display: "grid", gap: "1rem" }}>
              {error && <div className="adm-alert adm-alert-error">{error}</div>}
              <div>
                <label className="adm-label" htmlFor="faq-q">Question</label>
                <input
                  id="faq-q"
                  className="adm-input"
                  value={form.question}
                  onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                />
              </div>
              <div>
                <label className="adm-label" htmlFor="faq-a">Answer</label>
                <textarea
                  id="faq-a"
                  className="adm-input"
                  rows={4}
                  value={form.answer}
                  onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
                <div>
                  <label className="adm-label" htmlFor="faq-cat">Category</label>
                  <input
                    id="faq-cat"
                    className="adm-input"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="adm-label" htmlFor="faq-svc">Service</label>
                  <select
                    id="faq-svc"
                    className="adm-select"
                    value={form.serviceType}
                    onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))}
                  >
                    <option value="">Global (all services)</option>
                    {SERVICE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="adm-label" htmlFor="faq-loc">Location</label>
                  <select
                    id="faq-loc"
                    className="adm-select"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  >
                    <option value="">Any</option>
                    <option value="VRINDAVAN">Vrindavan</option>
                    <option value="MATHURA">Mathura</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>
                <div>
                  <label className="adm-label" htmlFor="faq-ord">Sort order</label>
                  <input
                    id="faq-ord"
                    type="number"
                    className="adm-input"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "end", paddingBottom: "0.35rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    Active
                  </label>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" className="adm-action-btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="button" className="adm-topbar-btn" disabled={saving} onClick={save}>
                  {saving ? "Saving…" : editingId ? "Save Changes" : "Create FAQ"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {faqs.length === 0 ? (
        <div className="adm-empty">
          <div className="adm-empty-title">No FAQs yet</div>
        </div>
      ) : (
        <div className="adm-table-card">
          <table className="adm-table">
            <thead>
              <tr>
                {["Question", "Service", "Category", "Order", "Status", "Actions"].map((h) => (
                  <th key={h} scope="col">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {faqs.map((f) => (
                <tr key={f.id}>
                  <td>
                    <div style={{ fontWeight: 500, marginBottom: "0.25rem" }}>{f.question}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--muted)", lineHeight: 1.5 }}>
                      {f.answer.slice(0, 120)}
                      {f.answer.length > 120 ? "…" : ""}
                    </div>
                  </td>
                  <td style={{ fontSize: "0.8125rem" }}>{f.serviceType ?? "Global"}</td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{f.category}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>{f.sortOrder}</td>
                  <td>
                    <span className={`adm-badge ${f.isActive ? "adm-badge-confirmed" : "adm-badge-cancelled"}`}>
                      {f.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.35rem" }}>
                      <button type="button" className="adm-action-btn" onClick={() => openEdit(f)} title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="adm-action-btn"
                        disabled={loadingId !== null}
                        onClick={() => toggleActive(f.id, !f.isActive)}
                        title={f.isActive ? "Deactivate" : "Activate"}
                      >
                        {f.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        type="button"
                        className="adm-action-btn"
                        disabled={loadingId !== null}
                        onClick={() => remove(f.id, f.question)}
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
