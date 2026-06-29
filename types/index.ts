// =============================================================================
// VRINDAVAN BHANDARA — Global TypeScript Types
// Source: PROJECT_RULES.md — no `any` types allowed
// =============================================================================

import type {
  User,
  Booking,
  Package,
  Payment,
  MediaProof,
  ProofTimelineEvent,
  ServiceCategory,
  PackageItem,
  FestivalCampaign,
  Testimonial,
  Blog,
  FAQ,
  Notification,
  GalleryImage,
  SevaStatistic,
  LocationPage,
  Admin,
  AuditLog,
  Coupon,
} from "@prisma/client";

export type {
  User,
  Booking,
  Package,
  Payment,
  MediaProof,
  ProofTimelineEvent,
  ServiceCategory,
  PackageItem,
  FestivalCampaign,
  Testimonial,
  Blog,
  FAQ,
  Notification,
  GalleryImage,
  SevaStatistic,
  LocationPage,
  Admin,
  AuditLog,
  Coupon,
};

// =============================================================================
// Extended / Joined Types
// =============================================================================

export type PackageWithItems = Package & {
  items: PackageItem[];
  serviceCategory: ServiceCategory;
};

export type BookingWithDetails = Booking & {
  user: Pick<User, "id" | "name" | "email" | "phone">;
  package: PackageWithItems;
  payment: Payment | null;
  mediaProofs: MediaProof[];
  proofTimeline: ProofTimelineEvent[];
};

export type BookingWithPackage = Booking & {
  package: Package & { serviceCategory: ServiceCategory };
  payment: Payment | null;
};

export type AdminWithUser = Admin & {
  user: Pick<User, "id" | "name" | "email" | "image">;
};

export type BlogWithMeta = Blog & {
  _count?: { views: number };
};

export type TestimonialWithUser = Testimonial & {
  user: Pick<User, "id" | "name" | "image"> | null;
};

// =============================================================================
// API Response Types
// =============================================================================

export type ApiResponse<T> = {
  success: true;
  data: T;
  message?: string;
} | {
  success: false;
  error: string;
  code?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// =============================================================================
// Razorpay Types
// =============================================================================

export type RazorpayOrder = {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: "created" | "attempted" | "paid";
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
};

export type RazorpayPaymentVerification = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayPaymentEntity = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  captured: boolean;
  description: string;
  email: string;
  contact: string;
  notes: Record<string, string>;
  error_code?: string | null;
  error_description?: string | null;
  created_at: number;
};

export type RazorpayRefundEntity = {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  notes: Record<string, string>;
  created_at: number;
};

export type RazorpayWebhookPayload = {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: RazorpayPaymentEntity;
    };
    refund?: {
      entity: RazorpayRefundEntity;
    };
    order?: {
      entity: RazorpayOrder;
    };
  };
  created_at: number;
};

// =============================================================================
// Booking Wizard / Form Types
// =============================================================================

export type BookingWizardStep =
  | "service"
  | "package"
  | "date"
  | "details"
  | "review"
  | "payment";

export type BookingFormState = {
  serviceType: string | null;
  packageId: string | null;
  sevaDate: Date | null;
  guestCount: number;
  dedicatedTo: string;
  gotra: string;
  occasion: string;
  specialInstructions: string;
  sevaLocation: string;
  couponCode: string;
};

// =============================================================================
// Seva Statistics
// =============================================================================

export type SevaStatisticDisplay = {
  key: string;
  label: string;
  value: bigint;
  unit: string | null;
  icon: string | null;
};

// =============================================================================
// Navigation
// =============================================================================

export type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

// =============================================================================
// SEO / Metadata
// =============================================================================

export type PageSeoProps = {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
};

export type JsonLdType =
  | "Organization"
  | "LocalBusiness"
  | "FAQPage"
  | "Event"
  | "Article"
  | "BreadcrumbList"
  | "Service"
  | "WebSite";

// =============================================================================
// Admin Dashboard
// =============================================================================

export type DashboardStats = {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalRevenue: number;
  totalUsers: number;
  activePackages: number;
  activeCampaigns: number;
};

export type BookingStatusCount = {
  status: string;
  _count: { status: number };
};

// =============================================================================
// File Upload
// =============================================================================

export type UploadedFile = {
  url: string;
  key: string;
  size: number;
  mimeType: string;
  originalName: string;
};

// =============================================================================
// WhatsApp Notification
// =============================================================================

export type WhatsAppTemplate =
  | "booking_confirmation"
  | "payment_received"
  | "seva_in_progress"
  | "seva_completed"
  | "proof_uploaded";

export type WhatsAppNotificationPayload = {
  phone: string;
  template: WhatsAppTemplate;
  params: Record<string, string>;
  userId?: string;
  bookingId?: string;
};

// =============================================================================
// Auth Session
// =============================================================================

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "CUSTOMER" | "ADMIN";
  adminRole?: "SUPER_ADMIN" | "OPERATIONS_ADMIN" | "CONTENT_ADMIN" | "SUPPORT_ADMIN";
};

// Flat booking wizard form data
export type BookingFormData = {
  serviceCategoryId: string;
  serviceType: string;
  serviceName: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  sevaDate: string;
  sevaLocation: 'VRINDAVAN' | 'MATHURA';
  guestCount: number;
  dedicatedTo: string;
  gotra: string;
  occasion: string;
  specialInstructions: string;
  couponCode: string;
  userName: string;
  userEmail: string;
  userPhone: string;
};
