"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, Eye, EyeOff, Trash2 } from "lucide-react";

type GalleryImage = {
  id: string;
  url: string;
  thumbnail: string | null;
  title: string | null;
  category: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

type Props = {
  images: GalleryImage[];
  page: number;
  totalPages: number;
  filterCategory: string;
};

export function GalleryClient({ images, page, totalPages, filterCategory }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [addingUrl, setAddingUrl] = useState("");
  const [addingCategory, setAddingCategory] = useState("GENERAL");
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  async function toggle(id: string, field: "isActive" | "isFeatured", value: boolean) {
    setLoadingId(id + field);
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Failed");
      startTransition(() => router.refresh());
    } catch {
      alert("Update failed");
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteImage(id: string) {
    if (!confirm("Delete this image from gallery?")) return;
    setLoadingId(id + "delete");
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      startTransition(() => router.refresh());
    } catch {
      alert("Delete failed");
    } finally {
      setLoadingId(null);
    }
  }

  async function addImage() {
    if (!addingUrl.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: addingUrl, category: addingCategory }),
      });
      if (!res.ok) throw new Error("Failed");
      setAddingUrl("");
      setShowAddForm(false);
      startTransition(() => router.refresh());
    } catch {
      alert("Failed to add image");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div>
      {/* Add image form */}
      <div className="mb-6">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #8B1E1E, #B89947)" }}
          >
            + Add Image URL
          </button>
        ) : (
          <div className="bg-white rounded-2xl border p-5 flex gap-3 items-end flex-wrap" style={{ borderColor: "rgba(212,175,55,0.15)" }}>
            <div className="flex-1 min-w-48">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Image URL (R2 or external)</label>
              <input
                type="url"
                value={addingUrl}
                onChange={(e) => setAddingUrl(e.target.value)}
                placeholder="https://…"
                className="w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none"
                style={{ borderColor: "rgba(212,175,55,0.2)" }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Category</label>
              <select
                value={addingCategory}
                onChange={(e) => setAddingCategory(e.target.value)}
                className="px-4 py-2.5 text-sm border rounded-xl focus:outline-none"
                style={{ borderColor: "rgba(212,175,55,0.2)" }}
              >
                {["BHANDARA", "BRAHMIN_BHOJ", "GAU_SEVA", "SADHU_BHOJAN", "FESTIVAL", "TEMPLE", "GENERAL"].map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={addImage} disabled={isAdding} className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl" style={{ background: "#8B1E1E" }}>
                {isAdding ? "Adding…" : "Add"}
              </button>
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-gray-100 text-gray-600">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {images.length === 0 ? (
        <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
          <div className="text-5xl mb-4">🖼️</div>
          <h3 className="font-semibold text-gray-700 mb-2">No images yet</h3>
          <p className="text-gray-400 text-sm">Add image URLs to populate the gallery.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group rounded-xl overflow-hidden bg-gray-100"
              style={{ aspectRatio: "1", opacity: img.isActive ? 1 : 0.45 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.thumbnail ?? img.url} alt={img.title ?? "Gallery"} className="w-full h-full object-cover" />

              {/* Featured badge */}
              {img.isFeatured && (
                <div className="absolute top-2 left-2 bg-amber-400 rounded-full p-1" title="Featured">
                  <Star size={10} className="text-white fill-white" />
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => toggle(img.id, "isFeatured", !img.isFeatured)}
                  disabled={!!loadingId}
                  className="p-2 rounded-full bg-white/20 hover:bg-amber-400 text-white transition-colors"
                  title={img.isFeatured ? "Unfeature" : "Feature"}
                >
                  <Star size={14} className={img.isFeatured ? "fill-white" : ""} />
                </button>
                <button
                  onClick={() => toggle(img.id, "isActive", !img.isActive)}
                  disabled={!!loadingId}
                  className="p-2 rounded-full bg-white/20 hover:bg-blue-500 text-white transition-colors"
                  title={img.isActive ? "Hide" : "Show"}
                >
                  {img.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={() => deleteImage(img.id)}
                  disabled={!!loadingId}
                  className="p-2 rounded-full bg-white/20 hover:bg-red-500 text-white transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Category badge */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                <p className="text-[9px] text-gray-300 truncate">{img.category.replace(/_/g, " ")}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-8">
          {page > 1 && (
            <Link href={`?category=${filterCategory}&page=${page - 1}`} className="px-4 py-2 text-xs rounded-lg bg-amber-50 text-amber-800 font-semibold">
              ← Prev
            </Link>
          )}
          <span className="px-4 py-2 text-xs text-gray-400">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={`?category=${filterCategory}&page=${page + 1}`} className="px-4 py-2 text-xs rounded-lg bg-amber-50 text-amber-800 font-semibold">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
