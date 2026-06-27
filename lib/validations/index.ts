// =============================================================================
// VRINDAVAN BHANDARA — Zod Validation Schemas
// Source: PROJECT_RULES.md — "Every form must use Zod validation"
// =============================================================================

import { z } from "zod";

// =============================================================================
// Auth Schemas
// =============================================================================

export const RegisterSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// =============================================================================
// Booking Schemas
// =============================================================================

export const CreateBookingSchema = z.object({
  packageId: z.string().cuid("Invalid package"),
  sevaDate: z.coerce
    .date()
    .min(new Date(Date.now() + 24 * 60 * 60 * 1000), "Seva date must be at least tomorrow"),
  sevaLocation: z.enum(["Vrindavan", "Mathura"]).default("Vrindavan"),
  guestCount: z.number().int().min(1).max(10000).default(1),
  dedicatedTo: z.string().max(100).optional(),
  gotra: z.string().max(100).optional(),
  occasion: z.string().max(100).optional(),
  specialInstructions: z.string().max(1000).optional(),
  couponCode: z.string().max(50).optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export const UpdateBookingStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "REFUNDED",
  ]),
  adminNotes: z.string().max(2000).optional(),
  completionNotes: z.string().max(2000).optional(),
});

export type UpdateBookingStatusInput = z.infer<typeof UpdateBookingStatusSchema>;

// =============================================================================
// Payment Schemas
// =============================================================================

export const CreatePaymentOrderSchema = z.object({
  bookingId: z.string().cuid("Invalid booking ID"),
});

export type CreatePaymentOrderInput = z.infer<typeof CreatePaymentOrderSchema>;

export const VerifyPaymentSchema = z.object({
  bookingId: z.string().cuid(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;

// =============================================================================
// Package Schemas (Admin)
// =============================================================================

export const CreatePackageSchema = z.object({
  serviceCategoryId: z.string().cuid(),
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10).max(5000),
  shortDesc: z.string().min(5).max(200),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  maxGuests: z.number().int().positive().optional(),
  duration: z.string().max(50).optional(),
  isCustom: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  badge: z.string().max(50).optional(),
  metaTitle: z.string().max(70).optional(),
  metaDesc: z.string().max(160).optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1).max(200),
        quantity: z.number().int().min(1),
        unit: z.string().max(20).optional(),
        sortOrder: z.number().int().default(0),
      })
    )
    .optional(),
});

export type CreatePackageInput = z.infer<typeof CreatePackageSchema>;

export const UpdatePackageSchema = CreatePackageSchema.extend({
  isActive: z.boolean().optional(),
}).partial();

export type UpdatePackageInput = z.infer<typeof UpdatePackageSchema>;

// =============================================================================
// Blog Schemas (Admin)
// =============================================================================

export const CreateBlogSchema = z.object({
  title: z.string().min(5).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().min(10).max(500),
  content: z.string().min(100),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  category: z.string().max(50).optional(),
  metaTitle: z.string().max(70).optional(),
  metaDesc: z.string().max(160).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export type CreateBlogInput = z.infer<typeof CreateBlogSchema>;

// =============================================================================
// Contact Schema
// =============================================================================

export const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/)
    .optional()
    .or(z.literal("")),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(2000),
});

export type ContactInput = z.infer<typeof ContactSchema>;

// =============================================================================
// Testimonial Schema
// =============================================================================

export const CreateTestimonialSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
  bookingId: z.string().cuid().optional(),
  isAnonymous: z.boolean().default(false),
});

export type CreateTestimonialInput = z.infer<typeof CreateTestimonialSchema>;

// =============================================================================
// Media Upload Schema
// =============================================================================

export const UploadMediaSchema = z.object({
  bookingId: z.string().cuid(),
  type: z.enum(["PHOTO", "VIDEO", "DOCUMENT"]),
  caption: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

export type UploadMediaInput = z.infer<typeof UploadMediaSchema>;

// =============================================================================
// Profile Update Schema
// =============================================================================

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/)
    .optional()
    .or(z.literal("")),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
  whatsappOptIn: z.boolean().default(false),
  emailOptIn: z.boolean().default(true),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// =============================================================================
// Coupon Schema
// =============================================================================

export const ApplyCouponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  bookingId: z.string().cuid(),
});

export type ApplyCouponInput = z.infer<typeof ApplyCouponSchema>;

// =============================================================================
// Proof Timeline Schema
// =============================================================================

export const AddTimelineEventSchema = z.object({
  bookingId: z.string().cuid(),
  eventType: z.enum([
    "BOOKING_RECEIVED",
    "PAYMENT_CONFIRMED",
    "PREPARATION_STARTED",
    "SEVA_IN_PROGRESS",
    "PHOTOS_UPLOADED",
    "VIDEOS_UPLOADED",
    "SEVA_COMPLETED",
    "CERTIFICATE_GENERATED",
    "PROOF_DELIVERED",
  ]),
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  mediaUrl: z.string().url().optional(),
  occurredAt: z.coerce.date().optional(),
});

export type AddTimelineEventInput = z.infer<typeof AddTimelineEventSchema>;
