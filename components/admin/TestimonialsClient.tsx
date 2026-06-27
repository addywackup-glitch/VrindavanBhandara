"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Star, Trash2, Search, Filter } from "lucide-react";

type Testimonial = {
  id: string;
  name: string;
  city: string | null;
  rating: number;
  comment: string;
  isApproved: boolean;
  isFeatured: boolean;
  serviceType: string | null;
  createdAt: string;
};

type Props = { testimonials: Testimonial[]; total: number; page: number; totalPages: number; filter: string };

export function TestimonialsClient({ testimonials, total, page, totalPages, filter }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function doAction(id: string, action: string) {
    setLoadingId(id + action);
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        ...(action !== "delete" && { body: JSON.stringify({ action }) }),
      });
      if (!res.ok) throw new Error("Failed");
      startTransition(() => router.refresh());
    } catch {
      alert("Action failed. Please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  const isLoading = (id: string, action: string) => loadingId === id + action;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {["ALL", "PENDING", "APPROVED", "FEATURED"].map((f) => (
          <button
            key={f}
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.set("filter", f);
              params.delete("page");
              router.push(`?${params.toString()}`);
            }}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{
              background: filter === f ? "#8B1E1E" : "#F5EEDB",
              color: filter === f ? "white" : "#5A3E2B",
            }}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">{total} testimonials</span>
      </div>

      {/* Table */}
      {testimonials.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
          <div className="text-5xl mb-4">💬</div>
          <h3 className="font-semibold text-gray-700 mb-2">No testimonials found</h3>
          <p className="text-gray-400 text-sm">There are no testimonials matching the current filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border p-5 flex gap-4"
              style={{ borderColor: t.isFeatured ? "rgba(184,153,71,0.4)" : "rgba(212,175,55,0.1)" }}
            >
              {/* Stars */}
              <div className="shrink-0">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-lg font-bold text-amber-700">
                  {t.name.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.city ?? "—"} · {t.serviceType ?? "General"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {t.isFeatured && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                        ⭐ Featured
                      </span>
                    )}
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: t.isApproved ? "#dcfce7" : "#fff7ed",
                        color: t.isApproved ? "#15803d" : "#c2410c",
                      }}
                    >
                      {t.isApproved ? "Approved" : "Pending"}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex gap-0.5 my-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < t.rating ? "text-amber-400" : "text-gray-200"} style={{ fontSize: 13 }}>
                      ★
                    </span>
                  ))}
                </div>

                <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{t.comment}</p>

                <p className="text-[10px] text-gray-300 mt-2">{new Date(t.createdAt).toLocaleDateString("en-IN")}</p>
              </div>

              {/* Actions */}
              <div className="shrink-0 flex flex-col gap-2">
                {!t.isApproved && (
                  <button
                    onClick={() => doAction(t.id, "approve")}
                    disabled={!!loadingId}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: "#dcfce7", color: "#15803d" }}
                    title="Approve"
                  >
                    <CheckCircle size={13} />
                    {isLoading(t.id, "approve") ? "…" : "Approve"}
                  </button>
                )}
                {t.isApproved && !t.isFeatured && (
                  <button
                    onClick={() => doAction(t.id, "feature")}
                    disabled={!!loadingId}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: "#fef9c3", color: "#854d0e" }}
                    title="Feature"
                  >
                    <Star size={13} />
                    {isLoading(t.id, "feature") ? "…" : "Feature"}
                  </button>
                )}
                {t.isFeatured && (
                  <button
                    onClick={() => doAction(t.id, "unfeature")}
                    disabled={!!loadingId}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: "#f3f4f6", color: "#374151" }}
                    title="Unfeature"
                  >
                    <Star size={13} />
                    {isLoading(t.id, "unfeature") ? "…" : "Unfeature"}
                  </button>
                )}
                {t.isApproved && (
                  <button
                    onClick={() => doAction(t.id, "reject")}
                    disabled={!!loadingId}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: "#fee2e2", color: "#b91c1c" }}
                    title="Reject"
                  >
                    <XCircle size={13} />
                    {isLoading(t.id, "reject") ? "…" : "Reject"}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Delete testimonial by ${t.name}?`)) doAction(t.id, "delete");
                  }}
                  disabled={!!loadingId}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: "#f9fafb", color: "#9ca3af" }}
                  title="Delete"
                >
                  <Trash2 size={13} />
                  {isLoading(t.id, "delete") ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set("page", String(p));
                router.push(`?${params.toString()}`);
              }}
              className="w-8 h-8 rounded-lg text-xs font-semibold transition-colors"
              style={{
                background: p === page ? "#8B1E1E" : "#F5EEDB",
                color: p === page ? "white" : "#5A3E2B",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Search component
export function TestimonialsSearch() {
  const router = useRouter();
  return (
    <div className="flex gap-3 mb-4">
      <div className="relative flex-1 max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search testimonials…"
          className="w-full pl-9 pr-4 py-2 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2"
          style={{ borderColor: "rgba(212,175,55,0.2)", focusRingColor: "#B89947" } as React.CSSProperties}
          onChange={(e) => {
            const params = new URLSearchParams(window.location.search);
            if (e.target.value) params.set("search", e.target.value);
            else params.delete("search");
            params.delete("page");
            router.push(`?${params.toString()}`);
          }}
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Filter size={12} />
        Filter by status above
      </div>
    </div>
  );
}
