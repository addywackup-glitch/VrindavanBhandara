"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ServiceTypeEnum, ServicePageSectionsSchema } from "@/lib/validations";

const ServiceFormSchema = z.object({
  type: ServiceTypeEnum,
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10).max(5000),
  shortDesc: z.string().min(5).max(300),
  icon: z.string().max(40).optional(),
  image: z.string().max(500).optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
  metaTitle: z.string().max(70).optional(),
  metaDesc: z.string().max(160).optional(),
  pageSectionsJson: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof ServiceFormSchema>;

type Props = {
  mode: "create" | "edit";
  serviceId?: string;
  availableTypes: string[];
  initial?: Partial<ServiceFormValues> & { pageSections?: unknown };
};

export function ServiceFormClient({ mode, serviceId, availableTypes, initial }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(ServiceFormSchema),
    defaultValues: {
      type: (initial?.type as ServiceFormValues["type"]) ?? (availableTypes[0] as ServiceFormValues["type"]),
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      shortDesc: initial?.shortDesc ?? "",
      icon: initial?.icon ?? "",
      image: initial?.image ?? "",
      isActive: initial?.isActive ?? true,
      sortOrder: initial?.sortOrder ?? 0,
      metaTitle: initial?.metaTitle ?? "",
      metaDesc: initial?.metaDesc ?? "",
      pageSectionsJson: initial?.pageSections
        ? JSON.stringify(initial.pageSections, null, 2)
        : "",
    },
  });

  async function onSubmit(values: ServiceFormValues) {
    setSaving(true);
    setError("");
    try {
      let pageSections: unknown = undefined;
      const raw = values.pageSectionsJson?.trim();
      if (raw) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          throw new Error("Page sections must be valid JSON");
        }
        const checked = ServicePageSectionsSchema.safeParse(parsed);
        if (!checked.success) {
          throw new Error("Page sections JSON does not match the expected shape");
        }
        pageSections = checked.data;
      } else if (mode === "edit") {
        pageSections = null;
      }

      const payload = {
        type: values.type,
        name: values.name,
        slug: values.slug,
        description: values.description,
        shortDesc: values.shortDesc,
        icon: values.icon || undefined,
        image: values.image || undefined,
        isActive: values.isActive,
        sortOrder: Number(values.sortOrder),
        metaTitle: values.metaTitle || undefined,
        metaDesc: values.metaDesc || undefined,
        ...(pageSections !== undefined ? { pageSections } : {}),
      };

      const url = mode === "create" ? "/api/admin/services" : `/api/admin/services/${serviceId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.message ?? "Save failed");

      router.push("/admin/services");
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

  if (mode === "create" && availableTypes.length === 0) {
    return (
      <div className="adm-empty">
        <div className="adm-empty-title">No service types available</div>
        <p className="adm-empty-desc">
          Every ServiceType is already assigned. Edit or delete an existing service first.
        </p>
        <Link href="/admin/services" className="adm-link" style={{ marginTop: "1rem" }}>
          ← Back to Services
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="adm-detail-card">
      <div className="adm-detail-card-header">
        {mode === "create" ? "Create Service" : "Edit Service"}
      </div>
      <div className="adm-detail-card-body" style={{ display: "grid", gap: "1.25rem" }}>
        {error && <div className="adm-alert adm-alert-error">{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          <div>
            <label className="adm-label" htmlFor="type">Service Type</label>
            <select id="type" className="adm-select" {...form.register("type")}>
              {availableTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
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
                  if (mode === "create") {
                    form.setValue("slug", slugifyName(e.target.value), { shouldValidate: true });
                  }
                },
              })}
            />
          </div>
          <div>
            <label className="adm-label" htmlFor="slug">Slug</label>
            <input id="slug" className="adm-input" {...form.register("slug")} />
          </div>
          <div>
            <label className="adm-label" htmlFor="icon">Icon (emoji or name)</label>
            <input id="icon" className="adm-input" {...form.register("icon")} />
          </div>
          <div>
            <label className="adm-label" htmlFor="sortOrder">Sort order</label>
            <input
              id="sortOrder"
              type="number"
              className="adm-input"
              {...form.register("sortOrder", { valueAsNumber: true })}
            />
          </div>
          <div style={{ display: "flex", alignItems: "end", gap: "0.75rem", paddingBottom: "0.35rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
              <input type="checkbox" {...form.register("isActive")} />
              Active
            </label>
          </div>
        </div>

        <div>
          <label className="adm-label" htmlFor="shortDesc">Short description</label>
          <input id="shortDesc" className="adm-input" {...form.register("shortDesc")} />
        </div>

        <div>
          <label className="adm-label" htmlFor="description">Full description</label>
          <textarea id="description" className="adm-input" rows={5} {...form.register("description")} />
        </div>

        <div>
          <label className="adm-label" htmlFor="image">Image URL</label>
          <input id="image" className="adm-input" {...form.register("image")} placeholder="https://…" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="adm-label" htmlFor="metaTitle">Meta title</label>
            <input id="metaTitle" className="adm-input" {...form.register("metaTitle")} />
          </div>
          <div>
            <label className="adm-label" htmlFor="metaDesc">Meta description</label>
            <input id="metaDesc" className="adm-input" {...form.register("metaDesc")} />
          </div>
        </div>

        <div>
          <label className="adm-label" htmlFor="pageSectionsJson">
            Page sections (JSON, optional)
          </label>
          <textarea
            id="pageSectionsJson"
            className="adm-input"
            rows={10}
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}
            placeholder='{"hero":{"tagline":"…"},"includedItems":["…"]}'
            {...form.register("pageSectionsJson")}
          />
          <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.35rem" }}>
            Leave empty to clear custom sections and use UI defaults. Validated against ServicePageSectionsSchema.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <Link href="/admin/services" className="adm-action-btn">Cancel</Link>
          <button type="submit" className="adm-topbar-btn" disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Create Service" : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
