"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, Eye, EyeOff, Trash2, Pencil, ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Package = {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  isActive: boolean;
  isFeatured: boolean;
  badge: string | null;
  duration: string | null;
  sortOrder: number;
  bookingCount: number;
  serviceCategory: { id: string; name: string };
  items: { description: string }[];
};

type Category = { id: string; name: string };

type Props = {
  packages: Package[];
  categories: Category[];
  total: number;
  page: number;
  totalPages: number;
  filter: string;
};

export function PackagesClient({ packages, categories, total, page, totalPages, filter }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function patchPackage(id: string, data: Record<string, unknown>) {
    setLoadingId(id + JSON.stringify(data));
    try {
      const res = await fetch(`/api/admin/packages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      startTransition(() => router.refresh());
    } catch {
      alert("Update failed");
    } finally {
      setLoadingId(null);
    }
  }

  async function deletePackage(id: string, name: string, bookingCount: number) {
    const msg = bookingCount > 0
      ? `"${name}" has ${bookingCount} booking(s). It will be deactivated instead of deleted. Proceed?`
      : `Delete package "${name}"? This cannot be undone.`;
    if (!confirm(msg)) return;

    setLoadingId(id + "delete");
    try {
      const res = await fetch(`/api/admin/packages/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message);
      startTransition(() => router.refresh());
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setLoadingId(null);
    }
  }

  const isLoading = (id: string, suffix: string) => loadingId?.startsWith(id + suffix) ?? false;

  return (
    <div>
      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => router.push("/admin/packages")}
          className="px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: filter === "ALL" ? "#8B1E1E" : "#F5EEDB", color: filter === "ALL" ? "white" : "#5A3E2B" }}
        >
          All ({total})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => router.push(`/admin/packages?categoryId=${cat.id}`)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: filter === cat.id ? "#8B1E1E" : "#F5EEDB", color: filter === cat.id ? "white" : "#5A3E2B" }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {packages.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
          <div className="text-5xl mb-4">📦</div>
          <h3 className="font-semibold text-gray-700 mb-2">No packages yet</h3>
          <Link href="/admin/packages/new" className="text-sm text-blue-600 hover:underline">Create your first package →</Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(212,175,55,0.08)", background: "#FDFAF5" }}>
                {["Order", "Name", "Category", "Price", "Bookings", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr
                  key={pkg.id}
                  className="border-t hover:bg-amber-50/20 transition-colors"
                  style={{
                    borderColor: "rgba(212,175,55,0.06)",
                    opacity: pkg.isActive ? 1 : 0.55,
                  }}
                >
                  {/* Sort order */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => patchPackage(pkg.id, { sortOrder: pkg.sortOrder - 1 })}
                        className="text-gray-400 hover:text-gray-700 transition-colors"
                        title="Move up"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <span className="text-xs text-gray-400 text-center">{pkg.sortOrder}</span>
                      <button
                        onClick={() => patchPackage(pkg.id, { sortOrder: pkg.sortOrder + 1 })}
                        className="text-gray-400 hover:text-gray-700 transition-colors"
                        title="Move down"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                  </td>
                  {/* Name */}
                  <td className="px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-sm">{pkg.name}</p>
                        {pkg.badge && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">{pkg.badge}</span>
                        )}
                        {pkg.isFeatured && <Star size={12} className="text-amber-400 fill-amber-400" />}
                      </div>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">{pkg.slug}</p>
                      {pkg.items.length > 0 && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[200px]">
                          {pkg.items[0].description}
                          {pkg.items.length > 1 && ` +${pkg.items.length - 1} more`}
                        </p>
                      )}
                    </div>
                  </td>
                  {/* Category */}
                  <td className="px-5 py-4 text-sm text-gray-600">{pkg.serviceCategory.name}</td>
                  {/* Price */}
                  <td className="px-5 py-4">
                    <p className="font-bold text-gray-800 text-sm">{formatCurrency(pkg.price)}</p>
                    {pkg.originalPrice && (
                      <p className="text-[11px] text-gray-400 line-through">{formatCurrency(pkg.originalPrice)}</p>
                    )}
                  </td>
                  {/* Bookings */}
                  <td className="px-5 py-4 text-sm text-gray-600">{pkg.bookingCount}</td>
                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: pkg.isActive ? "#dcfce7" : "#f9fafb",
                        color: pkg.isActive ? "#15803d" : "#6b7280",
                      }}
                    >
                      {pkg.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/packages/${pkg.id}/edit`} title="Edit" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600">
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => patchPackage(pkg.id, { isFeatured: !pkg.isFeatured })}
                        disabled={!!loadingId}
                        title={pkg.isFeatured ? "Unfeature" : "Feature"}
                        className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                        style={{ color: pkg.isFeatured ? "#B89947" : "#d1d5db" }}
                      >
                        <Star size={14} className={pkg.isFeatured ? "fill-current" : ""} />
                      </button>
                      <button
                        onClick={() => patchPackage(pkg.id, { isActive: !pkg.isActive })}
                        disabled={!!loadingId}
                        title={pkg.isActive ? "Deactivate" : "Activate"}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: pkg.isActive ? "#6b7280" : "#15803d" }}
                      >
                        {pkg.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => deletePackage(pkg.id, pkg.name, pkg.bookingCount)}
                        disabled={!!loadingId}
                        title="Delete"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t px-5 py-4 flex items-center justify-between" style={{ borderColor: "rgba(212,175,55,0.08)" }}>
              <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                {page > 1 && (
                  <button onClick={() => router.push(`?page=${page - 1}`)} className="px-3 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-800 font-semibold">
                    ← Prev
                  </button>
                )}
                {page < totalPages && (
                  <button onClick={() => router.push(`?page=${page + 1}`)} className="px-3 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-800 font-semibold">
                    Next →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
