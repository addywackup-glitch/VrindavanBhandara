// =============================================================================
// Booking Draft — localStorage persistence for the 7-step wizard
//
// Strategy:
//   • Auto-saved on every step navigation and form update
//   • Restored on wizard mount if draft is < MAX_AGE_MS old
//   • Cleared after successful booking creation (bookingId obtained)
//   • Payment info is NEVER persisted
//
// Draft is keyed by DRAFT_KEY and stored as JSON.
// Only serialisable, non-sensitive BookingFormData fields are stored.
// =============================================================================

import type { BookingFormData } from "@/types";

const DRAFT_KEY = "vb_booking_draft_v2";
const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

// Fields that are safe to persist (no PII that could be sensitive if left on device)
// We include devotee name and contact since they typed it intentionally.
// We exclude nothing from the form state itself — all fields are user-supplied.
// We DO NOT store: bookingId, paymentId, or any payment response data.

export type BookingDraft = {
  step: number;
  form: BookingFormData;
  savedAt: number; // epoch ms
};

export function saveDraft(form: BookingFormData, step: number): void {
  if (typeof window === "undefined") return;
  // Never persist to step 7 (payment step) — that's a new flow every time
  const persistStep = Math.min(step, 6);
  try {
    const draft: BookingDraft = {
      step: persistStep,
      form,
      savedAt: Date.now(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage quota exceeded or private browsing — silently ignore
  }
}

export function loadDraft(): BookingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as BookingDraft;
    // Expire old drafts
    if (!draft.savedAt || Date.now() - draft.savedAt > MAX_AGE_MS) {
      clearDraft();
      return null;
    }
    // Validate minimal shape
    if (!draft.form || typeof draft.step !== "number") return null;
    return draft;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Ignore
  }
}

export function hasDraft(): boolean {
  return loadDraft() !== null;
}
