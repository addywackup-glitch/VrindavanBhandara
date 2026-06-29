"use client";

// =============================================================================
// Step 5 — Sankalp — the sacred intention
// Dynamic name list (add/remove), gotra, prayer intention
// =============================================================================

import { useState } from "react";
import type { BookingFormData } from "@/types";

const MAX_NAMES = 10;

type Props = {
  form: BookingFormData;
  updateForm: (updates: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
};

export function SankalpStep({ form, updateForm, onNext, onBack }: Props) {
  const [names, setNames] = useState<string[]>(
    form.sankalpNames.length > 0 ? form.sankalpNames : [""]
  );
  const [gotra, setGotra] = useState(form.gotra);
  const [intention, setIntention] = useState(form.intention);

  const updateName = (idx: number, value: string) => {
    const updated = names.map((n, i) => (i === idx ? value : n));
    setNames(updated);
  };

  const addName = () => {
    if (names.length >= MAX_NAMES) return;
    setNames([...names, ""]);
  };

  const removeName = (idx: number) => {
    if (names.length <= 1) return;
    setNames(names.filter((_, i) => i !== idx));
  };

  const handleContinue = () => {
    const filteredNames = names.filter((n) => n.trim() !== "");
    updateForm({
      sankalpNames: filteredNames.length > 0 ? filteredNames : [""],
      gotra: gotra.trim(),
      intention: intention.trim(),
      dedicatedTo: filteredNames.join(", "),
    });
    onNext();
  };

  return (
    <div>
      <div className="step-heading">Sankalp — the sacred intention</div>
      <div className="step-sub">
        The Sankalp is the formal dedication of the Seva. These names will be recited by the
        Brahmin pandit during the ceremony.
      </div>

      {/* Gotra */}
      <div className="form-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="form-group full">
          <label htmlFor="gotra" className="form-label">
            Gotra (family lineage name)
          </label>
          <input
            id="gotra"
            type="text"
            className="input"
            placeholder="e.g. Kashyap, Bharadwaj, Vasishtha…"
            value={gotra}
            onChange={(e) => setGotra(e.target.value)}
          />
          <span className="form-hint">
            If unknown, leave blank. The pandit will recite a universal gotra.
          </span>
        </div>
      </div>

      {/* Sankalp names */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div className="form-label" style={{ marginBottom: "0.75rem" }}>
          Names to include in the Sankalp{" "}
          <span style={{ fontWeight: 400, color: "var(--muted)" }}>
            (up to {MAX_NAMES})
          </span>
        </div>
        <div className="sankalp-names" id="sankalpNamesList" aria-label="Sankalp names">
          {names.map((name, idx) => (
            <div key={idx} className="sankalp-name-row">
              <input
                type="text"
                className="input"
                placeholder={idx === 0 ? "Full name (e.g. Ramesh Kumar Sharma)" : "Full name"}
                value={name}
                onChange={(e) => updateName(idx, e.target.value)}
                aria-label={`Sankalp name ${idx + 1}`}
              />
              <button
                className="btn-remove-name"
                onClick={() => removeName(idx)}
                disabled={names.length <= 1}
                aria-label={`Remove name ${idx + 1}`}
                type="button"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {names.length < MAX_NAMES && (
          <button
            className="btn-add-name"
            onClick={addName}
            style={{ marginTop: "0.75rem" }}
            aria-label="Add another name to Sankalp"
            type="button"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add another name
          </button>
        )}
      </div>

      {/* Prayer intention */}
      <div className="form-group" style={{ marginBottom: "1.5rem" }}>
        <label htmlFor="intention" className="form-label">
          Specific intention or prayer (optional)
        </label>
        <textarea
          id="intention"
          className="input"
          placeholder="e.g. May the departed soul of my father find peace and liberation. May our family be blessed with good health and prosperity."
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
        />
      </div>

      {/* Info note */}
      <div
        style={{
          padding: "1rem 1.25rem",
          background: "var(--surface-brand)",
          borderRadius: "var(--r-md)",
          border: "1.5px solid oklch(30% 0.12 148 / 0.18)",
          fontSize: "0.875rem",
          color: "var(--muted)",
          lineHeight: 1.6,
        }}
        role="note"
      >
        <strong style={{ color: "var(--brand)" }}>Note:</strong> The Pandit will recite these
        names in Sanskrit during the sankalp. For departed souls, please prefix the name with
        &ldquo;Swargiya&rdquo; or &ldquo;Late.&rdquo;
      </div>

      <div className="step-nav">
        <button className="btn-back" onClick={onBack} type="button">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button className="btn-next" onClick={handleContinue} type="button">
          Continue
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
