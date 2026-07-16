import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistance } from "date-fns";

// =============================================================================
// Class name utility (Shadcn standard)
// =============================================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =============================================================================
// Currency Formatting (INR)
// =============================================================================
export function formatCurrency(
  amount: number | string | { toNumber(): number },
  currency: string = "INR"
): string {
  const value =
    typeof amount === "object" ? amount.toNumber() : Number(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// =============================================================================
// Date Formatting
// =============================================================================
export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMMM yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy, hh:mm a");
}

export function formatRelative(date: Date | string): string {
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
}

// =============================================================================
// Booking Number Generator
// =============================================================================
export function generateBookingNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `VB-${year}-${random}`;
}

// =============================================================================
// Slug Generator
// =============================================================================
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// =============================================================================
// Truncate Text
// =============================================================================
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

// =============================================================================
// Number Formatter (Indian numbering)
// =============================================================================
export function formatNumber(num: number | bigint): string {
  const value = typeof num === "bigint" ? Number(num) : num;
  return new Intl.NumberFormat("en-IN").format(value);
}

// =============================================================================
// Phone number formatter
// =============================================================================
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

// =============================================================================
// Public media URL (Supabase Storage or absolute URL passthrough)
// =============================================================================
export function getMediaUrl(keyOrUrl: string): string {
  if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
    return keyOrUrl;
  }
  const base =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ??
    process.env.CLOUDFLARE_R2_PUBLIC_URL ??
    "";
  if (!base) return keyOrUrl;
  if (base.includes("supabase.co")) {
    return `${base}/storage/v1/object/public/proofs/${keyOrUrl.replace(/^\//, "")}`;
  }
  return `${base}/${keyOrUrl.replace(/^\//, "")}`;
}

// =============================================================================
// Sleep utility (used in webhook retry logic)
// =============================================================================
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Safe JSON parse
// =============================================================================
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// =============================================================================
// Status color mapping (for Shadcn Badge variant)
// =============================================================================
export function getBookingStatusColor(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
      return "default";
    case "PENDING":
      return "secondary";
    case "CANCELLED":
    case "REFUNDED":
      return "destructive";
    case "IN_PROGRESS":
      return "outline";
    default:
      return "secondary";
  }
}
