"use client";

import { useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import type { AboutPageContent, AboutPillar, AboutStat } from "@/lib/site-config";

type Props = {
  initial: AboutPageContent;
};

export function AboutEditorClient({ initial }: Props) {
  const [form, setForm] = useState<AboutPageContent>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function setField<K extends keyof AboutPageContent>(key: K, value: AboutPageContent[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updatePillar(index: number, patch: Partial<AboutPillar>) {
    setForm((prev) => ({
      ...prev,
      pillars: prev.pillars.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  }

  function updateStat(index: number, patch: Partial<AboutStat>) {
    setForm((prev) => ({
      ...prev,
      stats: prev.stats.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "about.page",
          value: JSON.stringify(form),
          type: "json",
          group: "content",
          label: "About page",
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to save");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "adm-input";
  const labelClass = "adm-label";

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <div className="adm-detail-card">
        <div className="adm-detail-card-header">Hero</div>
        <div className="adm-detail-card-body" style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label className={labelClass}>Eyebrow label</label>
            <input className={inputClass} value={form.heroLabel} onChange={(e) => setField("heroLabel", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Title</label>
            <input className={inputClass} value={form.heroTitle} onChange={(e) => setField("heroTitle", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Subtitle</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.heroSubtitle}
              onChange={(e) => setField("heroSubtitle", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="adm-detail-card">
        <div className="adm-detail-card-header">Stats</div>
        <div className="adm-detail-card-body" style={{ display: "grid", gap: "0.75rem" }}>
          {form.stats.map((stat, i) => (
            <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <input
                className={inputClass}
                style={{ width: 140 }}
                placeholder="Value"
                value={stat.value}
                onChange={(e) => updateStat(i, { value: e.target.value })}
              />
              <input
                className={inputClass}
                style={{ flex: 1, minWidth: 160 }}
                placeholder="Label"
                value={stat.label}
                onChange={(e) => updateStat(i, { label: e.target.value })}
              />
              <button
                type="button"
                className="adm-action-btn"
                onClick={() => setForm((prev) => ({ ...prev, stats: prev.stats.filter((_, j) => j !== i) }))}
                aria-label="Remove stat"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="adm-topbar-btn"
            style={{ width: "fit-content" }}
            onClick={() => setForm((prev) => ({ ...prev, stats: [...prev.stats, { value: "", label: "" }] }))}
          >
            <Plus size={14} /> Add stat
          </button>
        </div>
      </div>

      <div className="adm-detail-card">
        <div className="adm-detail-card-header">Story</div>
        <div className="adm-detail-card-body" style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label className={labelClass}>Section label</label>
            <input className={inputClass} value={form.storyLabel} onChange={(e) => setField("storyLabel", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Section title</label>
            <input className={inputClass} value={form.storyTitle} onChange={(e) => setField("storyTitle", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Paragraphs (one blank line between paragraphs)</label>
            <textarea
              className={inputClass}
              rows={10}
              value={form.storyParagraphs.join("\n\n")}
              onChange={(e) =>
                setField(
                  "storyParagraphs",
                  e.target.value
                    .split(/\n\s*\n/)
                    .map((p) => p.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>
        </div>
      </div>

      <div className="adm-detail-card">
        <div className="adm-detail-card-header">Pillars</div>
        <div className="adm-detail-card-body" style={{ display: "grid", gap: "1rem" }}>
          {form.pillars.map((pillar, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gap: "0.5rem",
                padding: "0.75rem",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  className={inputClass}
                  style={{ width: 72 }}
                  placeholder="Icon"
                  value={pillar.icon}
                  onChange={(e) => updatePillar(i, { icon: e.target.value })}
                />
                <input
                  className={inputClass}
                  style={{ flex: 1 }}
                  placeholder="Title"
                  value={pillar.title}
                  onChange={(e) => updatePillar(i, { title: e.target.value })}
                />
                <button
                  type="button"
                  className="adm-action-btn"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, pillars: prev.pillars.filter((_, j) => j !== i) }))
                  }
                  aria-label="Remove pillar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                className={inputClass}
                rows={2}
                placeholder="Description"
                value={pillar.desc}
                onChange={(e) => updatePillar(i, { desc: e.target.value })}
              />
            </div>
          ))}
          <button
            type="button"
            className="adm-topbar-btn"
            style={{ width: "fit-content" }}
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                pillars: [...prev.pillars, { icon: "🙏", title: "", desc: "" }],
              }))
            }
          >
            <Plus size={14} /> Add pillar
          </button>
        </div>
      </div>

      <div className="adm-detail-card">
        <div className="adm-detail-card-header">Call to action</div>
        <div className="adm-detail-card-body" style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label className={labelClass}>Supporting text</label>
            <input className={inputClass} value={form.ctaText} onChange={(e) => setField("ctaText", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Button label</label>
            <input className={inputClass} value={form.ctaButton} onChange={(e) => setField("ctaButton", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Button link</label>
            <input className={inputClass} value={form.ctaHref} onChange={(e) => setField("ctaHref", e.target.value)} />
          </div>
        </div>
      </div>

      {error && <div className="adm-alert" style={{ color: "#b91c1c" }}>{error}</div>}

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className={saved ? "adm-action-btn" : "adm-topbar-btn"}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
          {saving ? "Saving…" : saved ? "Saved" : "Save About page"}
        </button>
        <a href="/about" target="_blank" rel="noopener noreferrer" className="adm-filter-btn">
          Preview public page ↗
        </a>
      </div>
    </div>
  );
}
