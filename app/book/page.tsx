import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata: Metadata = {
  title: "Book Seva — Vrindavan Bhandara",
  description: "Book your sacred seva in Vrindavan or Mathura. Choose from Bhandara, Brahmin Bhoj, Gau Seva, Sadhu Bhojan, and Festival Seva.",
  robots: { index: false, follow: false }, // Don't index booking flow
};

export default function BookSevaPage() {
  return <BookingWizard />;
}
