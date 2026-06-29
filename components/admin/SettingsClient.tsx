"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

type Props = {
  settingKey: string;
  label: string;
  type: "string" | "boolean" | "number";
  placeholder?: string;
  initialValue: string;
};

export function SettingsClient({ settingKey, label, type, placeholder, initialValue }: Props) {
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isDirty = value !== initialValue;

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: settingKey, value, type }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed");
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

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
      <label className="adm-label" style={{ width: 220, marginBottom: 0 }}>{label}</label>

      {type === "boolean" ? (
        <button
          onClick={() => setValue(value === "true" ? "false" : "true")}
          className="relative inline-flex h-6 w-11 rounded-full transition-colors focus:outline-none"
          style={{ background: value === "true" ? "#8B1E1E" : "#e5e7eb" }}
          role="switch"
          aria-checked={value === "true"}
        >
          <span
            className="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5"
            style={{ transform: value === "true" ? "translateX(22px)" : "translateX(2px)" }}
          />
        </button>
      ) : (
        <input
          type={type === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
          style={{ flex: 1 }}
        />
      )}

      {(isDirty || saving || saved) && (
        <button
          onClick={save}
          disabled={saving || saved}
          className={saved ? "adm-action-btn" : "adm-topbar-btn"}
          style={{ fontSize: "0.75rem", padding: "0.375rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <Check size={12} /> : null}
          {saving ? "Saving…" : saved ? "Saved!" : "Save"}
        </button>
      )}

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
