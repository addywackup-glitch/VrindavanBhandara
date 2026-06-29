"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

const PackageItemSchema = z.object({
  description: z.string().min(1).max(200),
  quantity: z.number().int().min(1),
  unit: z.string().max(20).optional(),
  sortOrder: z.number().int(),
});

const PackageFormSchema = z.object({
  serviceCategoryId: z.string().cuid(),
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10).max(5000),
  shortDesc: z.string().min(5).max(200),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  maxGuests: z.number().int().positive().optional(),
  duration: z.string().max(50).optional(),
  isCustom: z.boolean(),
  isFeatured: z.boolean(),
  isActive: z.boolean().optional(),
  badge: z.string().max(50).optional(),
  metaTitle: z.string().max(70).optional(),
  metaDesc: z.string().max(160).optional(),
  items: z.array(PackageItemSchema).optional(),
});

type PackageFormValues = z.infer<typeof PackageFormSchema>;

type Category = { id: string; name: string };

type PackageItem = {
  description: string;
  quantity: number;
  unit?: string | null;
  sortOrder?: number;
};

type Props = {
  categories: Category[];
  mode: "create" | "edit";
  packageId?: string;
  initial?: Partial<PackageFormValues> & { items?: PackageItem[] };
};

export function PackageFormClient({ categories, mode, packageId, initial }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(PackageFormSchema),
    defaultValues: {
      serviceCategoryId: initial?.serviceCategoryId ?? categories[0]?.id ?? "",
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      shortDesc: initial?.shortDesc ?? "",
      price: initial?.price ?? 0,
      originalPrice: initial?.originalPrice,
      maxGuests: initial?.maxGuests,
      duration: initial?.duration ?? "",
      isCustom: initial?.isCustom ?? false,
      isFeatured: initial?.isFeatured ?? false,
      isActive: initial?.isActive ?? true,
      badge: initial?.badge ?? "",
      metaTitle: initial?.metaTitle ?? "",
      metaDesc: initial?.metaDesc ?? "",
      items: initial?.items?.length
        ? initial.items.map((item, i) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit ?? "",
            sortOrder: item.sortOrder ?? i,
          }))
        : [{ description: "", quantity: 1, unit: "", sortOrder: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  async function onSubmit(values: PackageFormValues) {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...values,
        originalPrice: values.originalPrice || undefined,
        maxGuests: values.maxGuests || undefined,
        duration: values.duration || undefined,
        badge: values.badge || undefined,
        metaTitle: values.metaTitle || undefined,
        metaDesc: values.metaDesc || undefined,
        items: values.items?.filter((item) => item.description.trim()).map((item, i) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit || undefined,
          sortOrder: item.sortOrder ?? i,
        })),
      };

      const url = mode === "create" ? "/api/admin/packages" : `/api/admin/packages/${packageId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.message ?? "Save failed");

      router.push("/admin/packages");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function slugifyName(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="adm-detail-card">
      <div className="adm-detail-card-header">
        {mode === "create" ? "Create Package" : "Edit Package"}
      </div>
      <div className="adm-detail-card-body" style={{ display: "grid", gap: "1.25rem" }}>
        {error && <div className="adm-alert adm-alert-error">{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          <div>
            <label className="adm-label" htmlFor="serviceCategoryId">Service Category</label>
            <select id="serviceCategoryId" className="adm-select" {...form.register("serviceCategoryId")}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="adm-label" htmlFor="name">Name</label>
            <input
              id="name"
              className="adm-input"
              {...form.register("name", {
                onChange: (e) => {
                  if (mode === "create" && !form.getValues("slug")) {
                    form.setValue("slug", slugifyName(e.target.value));
                  }
                },
              })}
            />
            {form.formState.errors.name && (
              <p style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: "0.25rem" }}>{form.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="adm-label" htmlFor="slug">Slug</label>
            <input id="slug" className="adm-input" {...form.register("slug")} />
          </div>
          <div>
            <label className="adm-label" htmlFor="price">Price (₹)</label>
            <input id="price" type="number" step="0.01" className="adm-input" {...form.register("price", { valueAsNumber: true })} />
          </div>
          <div>
            <label className="adm-label" htmlFor="originalPrice">Original Price (₹)</label>
            <input id="originalPrice" type="number" step="0.01" className="adm-input" {...form.register("originalPrice", { valueAsNumber: true })} />
          </div>
          <div>
            <label className="adm-label" htmlFor="duration">Duration</label>
            <input id="duration" className="adm-input" placeholder="e.g. 2 hours" {...form.register("duration")} />
          </div>
          <div>
            <label className="adm-label" htmlFor="badge">Badge</label>
            <input id="badge" className="adm-input" placeholder="Popular" {...form.register("badge")} />
          </div>
        </div>

        <div>
          <label className="adm-label" htmlFor="shortDesc">Short Description</label>
          <input id="shortDesc" className="adm-input" {...form.register("shortDesc")} />
        </div>
        <div>
          <label className="adm-label" htmlFor="description">Full Description</label>
          <textarea id="description" className="adm-textarea" rows={4} {...form.register("description")} />
        </div>

        <div>
          <div className="adm-section-header" style={{ marginBottom: "0.75rem" }}>
            <div className="adm-section-title" style={{ fontSize: "0.9375rem" }}>Package Items</div>
            <button type="button" className="adm-action-btn" onClick={() => append({ description: "", quantity: 1, unit: "", sortOrder: fields.length })}>
              + Add Item
            </button>
          </div>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {fields.map((field, index) => (
              <div key={field.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px auto", gap: "0.5rem", alignItems: "end" }}>
                <div>
                  <label className="adm-label">Description</label>
                  <input className="adm-input" {...form.register(`items.${index}.description`)} />
                </div>
                <div>
                  <label className="adm-label">Qty</label>
                  <input type="number" className="adm-input" {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="adm-label">Unit</label>
                  <input className="adm-input" {...form.register(`items.${index}.unit`)} />
                </div>
                {fields.length > 1 && (
                  <button type="button" className="adm-action-btn danger" onClick={() => remove(index)} aria-label="Remove item">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
            <input type="checkbox" {...form.register("isFeatured")} /> Featured
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
            <input type="checkbox" {...form.register("isCustom")} /> Custom Package
          </label>
          {mode === "edit" && (
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
              <input type="checkbox" {...form.register("isActive")} /> Active
            </label>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", paddingTop: "0.5rem" }}>
          <button type="submit" className="adm-topbar-btn" disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Create Package" : "Save Changes"}
          </button>
          <Link href="/admin/packages" className="adm-action-btn">Cancel</Link>
        </div>
      </div>
    </form>
  );
}
