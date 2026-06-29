// =============================================================================
// Booking Analytics — Event Abstraction Layer
//
// This module defines all booking funnel events and their schemas.
// No analytics provider is integrated yet — all calls are no-ops in production
// and console.debug in development.
//
// When an analytics provider is added (e.g. PostHog, Segment, GA4), inject it
// here by setting `analyticsProvider` — no callsites need to change.
// =============================================================================

// ── Event definitions ─────────────────────────────────────────────────────────

export type BookingEventName =
  | "booking_started"
  | "service_selected"
  | "package_selected"
  | "date_selected"
  | "details_completed"
  | "sankalp_completed"
  | "booking_review_viewed"
  | "payment_initiated"
  | "payment_success"
  | "payment_failed"
  | "payment_cancelled"
  | "booking_completed"
  | "draft_restored"
  | "draft_cleared";

// Typed payload per event for strict event schema enforcement
export type BookingEventPayload = {
  booking_started: {
    source?: "home" | "service_page" | "direct";
  };
  service_selected: {
    serviceType: string;
    serviceName: string;
    serviceId: string;
  };
  package_selected: {
    packageId: string;
    packageName: string;
    price: number;
    serviceType: string;
  };
  date_selected: {
    daysInAdvance: number;
    sevaDate: string;
  };
  details_completed: {
    hasCity: boolean;
    hasOccasion: boolean;
    hasSpecialInstructions: boolean;
  };
  sankalp_completed: {
    nameCount: number;
    hasGotra: boolean;
    hasIntention: boolean;
  };
  booking_review_viewed: {
    packageId: string;
    totalAmount: number;
  };
  payment_initiated: {
    bookingId: string;
    amount: number;
    currency: string;
    orderId: string;
  };
  payment_success: {
    bookingId: string;
    bookingNumber: string;
    amount: number;
    paymentId: string;
  };
  payment_failed: {
    bookingId: string;
    errorCode: string;
    errorMessage: string;
  };
  payment_cancelled: {
    bookingId: string;
  };
  booking_completed: {
    bookingId: string;
    bookingNumber: string;
    totalAmount: number;
    serviceType: string;
  };
  draft_restored: {
    step: number;
  };
  draft_cleared: {
    reason: "completed" | "expired" | "user_dismissed";
  };
};

// ── Provider interface ────────────────────────────────────────────────────────

type AnalyticsProvider = {
  track<E extends BookingEventName>(
    event: E,
    payload: BookingEventPayload[E]
  ): void;
};

// No-op provider (default until a real one is injected)
const noopProvider: AnalyticsProvider = {
  track() {
    // No-op — provider not yet configured
  },
};

// Mutable slot for provider injection
let _provider: AnalyticsProvider = noopProvider;

export function setAnalyticsProvider(provider: AnalyticsProvider): void {
  _provider = provider;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function trackBookingEvent<E extends BookingEventName>(
  event: E,
  payload: BookingEventPayload[E]
): void {
  if (process.env.NODE_ENV === "development") {
    // Development-only logging for booking funnel debugging
    const devLog = (window as typeof window & { __bookingDebug?: boolean }).__bookingDebug;
    if (devLog) {
      // Only logs when window.__bookingDebug = true is set in browser devtools
      (window as typeof window & { __bookingLog?: (e: string, d: unknown) => void })
        .__bookingLog?.(event, payload);
    }
  }
  try {
    _provider.track(event, payload);
  } catch {
    // Analytics must never break the booking flow
  }
}
