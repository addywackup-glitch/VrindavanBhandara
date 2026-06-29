"use client";

// =============================================================================
// Step 3 — Choose your Seva date
// Custom calendar with min 3 days advance, today highlight, disabled past dates
// =============================================================================

import { useState } from "react";
import type { BookingFormData } from "@/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type Props = {
  form: BookingFormData;
  updateForm: (updates: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
};

function getMinDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDisplayDate(d: Date) {
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(d: Date) {
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DateStep({ form, updateForm, onNext, onBack }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initialDate = form.sevaDate ? new Date(form.sevaDate) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const selectedDate = form.sevaDate ? new Date(form.sevaDate) : null;
  const minDate = getMinDate();

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const changeMonth = (dir: 1 | -1) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  const handlePickDate = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    if (d < minDate) return;
    updateForm({ sevaDate: d.toISOString() });
  };

  const canContinue = !!form.sevaDate;

  return (
    <div>
      <div className="step-heading">Choose your Seva date</div>
      <div className="step-sub">
        Dates must be booked at least 3 days in advance. Dates in grey are unavailable.
      </div>

      <div className="calendar-wrap" role="region" aria-label="Seva date calendar">
        {/* Calendar header */}
        <div className="cal-header">
          <button
            className="cal-nav-btn"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            type="button"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="cal-title" aria-live="polite">
            {MONTHS[viewMonth]} {viewYear}
          </div>
          <button
            className="cal-nav-btn"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            type="button"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Day names */}
        <div className="cal-grid" role="row">
          {DAY_NAMES.map((name) => (
            <div key={name} className="cal-day-name" role="columnheader" aria-label={name}>
              {name}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="cal-grid" role="grid" aria-label={`${MONTHS[viewMonth]} ${viewYear}`}>
          {/* Empty cells for first day offset */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} aria-hidden="true" />
          ))}
          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(viewYear, viewMonth, day);
            const isDisabled = date < minDate;
            const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
            const isToday = isSameDay(date, today);

            let cls = "cal-day";
            if (isSelected) cls += " selected";
            else if (isToday) cls += " today";
            if (isDisabled) cls += " disabled";

            return (
              <button
                key={day}
                className={cls}
                onClick={() => handlePickDate(day)}
                disabled={isDisabled}
                aria-label={`${day} ${MONTHS[viewMonth]} ${viewYear}${isDisabled ? " — unavailable" : ""}${isSelected ? " — selected" : ""}${isToday ? " — today" : ""}`}
                aria-pressed={isSelected}
                type="button"
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date display */}
      <div
        style={{
          marginTop: "1.5rem",
          padding: "0.875rem 1rem",
          background: "var(--surface-brand)",
          borderRadius: "var(--r-md)",
          border: "1.5px solid oklch(30% 0.12 148 / 0.18)",
          fontSize: "0.875rem",
          color: "var(--brand)",
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        <strong>Selected:</strong>{" "}
        {selectedDate ? formatDisplayDate(selectedDate) : "No date selected"}
      </div>

      {/* Min date info */}
      <p style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "var(--muted)" }}>
        Earliest available date:{" "}
        <strong style={{ color: "var(--fg)" }}>{formatShortDate(minDate)}</strong>
      </p>

      <div className="step-nav">
        <button className="btn-back" onClick={onBack} type="button">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button
          className="btn-next"
          onClick={onNext}
          disabled={!canContinue}
          aria-disabled={!canContinue}
          type="button"
        >
          Continue
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
