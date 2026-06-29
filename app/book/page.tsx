import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata: Metadata = {
  title: "Book Seva — Vrindavan Bhandara",
  description: "Book your sacred seva in Vrindavan or Mathura. Choose from Bhandara, Brahmin Bhoj, Gau Seva, Sadhu Bhojan, and Festival Seva.",
  robots: { index: false, follow: false },
};

export default function BookSevaPage() {
  return (
    <Suspense
      fallback={
        <div className="booking-shell" style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
          Loading booking flow…
        </div>
      }
    >
      <BookingWizard />
    </Suspense>
  );
}
