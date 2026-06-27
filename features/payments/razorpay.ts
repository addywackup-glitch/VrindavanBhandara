// =============================================================================
// VRINDAVAN BHANDARA — Razorpay Integration
// Source: PROJECT_RULES.md — "Always maintain Razorpay integration"
// Mode: Test mode with production-grade webhook verification
// =============================================================================

import Razorpay from "razorpay";
import crypto from "crypto";
import type { RazorpayOrder, RazorpayWebhookPayload } from "@/types";

// Lazy singleton — initialized on first use at runtime, not at build time
let _razorpay: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID ?? "",
      key_secret: process.env.RAZORPAY_KEY_SECRET ?? "",
    });
  }
  return _razorpay;
}

// =============================================================================
// Create Razorpay Order
// =============================================================================

export type CreateOrderParams = {
  amount: number;     // In paise (INR * 100)
  currency?: string;
  receipt: string;    // Booking number
  notes?: Record<string, string>;
};

export async function createRazorpayOrder(
  params: CreateOrderParams
): Promise<RazorpayOrder> {
  const order = await getRazorpay().orders.create({
    amount: Math.round(params.amount * 100), // Convert INR to paise
    currency: params.currency ?? "INR",
    receipt: params.receipt,
    notes: params.notes,
  });

  return order as unknown as RazorpayOrder;
}

// =============================================================================
// Verify Payment Signature
// Source: Razorpay docs — HMAC-SHA256 verification
// =============================================================================

export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const body = `${params.orderId}|${params.paymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(params.signature)
  );
}

// =============================================================================
// Verify Webhook Signature
// Source: Razorpay docs — HMAC-SHA256 webhook verification
// =============================================================================

export function verifyRazorpayWebhook(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

// =============================================================================
// Parse Webhook Payload
// =============================================================================

export function parseWebhookPayload(rawBody: string): RazorpayWebhookPayload {
  return JSON.parse(rawBody) as RazorpayWebhookPayload;
}

// =============================================================================
// Fetch Payment Details
// =============================================================================

export async function fetchRazorpayPayment(paymentId: string) {
  const payment = await getRazorpay().payments.fetch(paymentId);
  return payment;
}

// =============================================================================
// Initiate Refund
// =============================================================================

export async function initiateRefund(params: {
  paymentId: string;
  amount?: number; // partial refund in paise — omit for full refund
  notes?: Record<string, string>;
}) {
  const refund = await getRazorpay().payments.refund(params.paymentId, {
    amount: params.amount,
    notes: params.notes,
  });
  return refund;
}

export default getRazorpay;
