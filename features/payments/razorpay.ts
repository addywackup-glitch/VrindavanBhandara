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
  amount: number;     // In rupees (INR) — converted to paise internally
  currency?: string;
  receipt: string;    // Booking number
  notes?: Record<string, string>;
};

export class RazorpayApiError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "RazorpayApiError";
    this.statusCode = statusCode;
  }
}

function parseRazorpayError(error: unknown): RazorpayApiError {
  if (error && typeof error === "object") {
    const err = error as {
      statusCode?: number;
      error?: { description?: string; code?: string };
      message?: string;
    };
    const statusCode = err.statusCode ?? 500;
    const message =
      err.error?.description ??
      err.message ??
      "Razorpay order creation failed.";
    return new RazorpayApiError(message, statusCode);
  }
  return new RazorpayApiError("Razorpay order creation failed.");
}

export async function createRazorpayOrder(
  params: CreateOrderParams
): Promise<RazorpayOrder> {
  const amountPaise = Math.round(params.amount * 100);
  if (amountPaise < 100) {
    throw new RazorpayApiError("Minimum payment amount is ₹1 (100 paise).", 400);
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new RazorpayApiError("Razorpay credentials are not configured.", 401);
  }

  try {
    const order = await getRazorpay().orders.create({
      amount: amountPaise,
      currency: params.currency ?? "INR",
      receipt: params.receipt,
      notes: params.notes,
    });

    return order as unknown as RazorpayOrder;
  } catch (error) {
    if (error instanceof RazorpayApiError) throw error;
    throw parseRazorpayError(error);
  }
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

  return safeCompare(expectedSignature, params.signature);
}

// =============================================================================
// Constant-time comparison guard
// crypto.timingSafeEqual throws a RangeError when buffer lengths differ — a
// malformed/forged signature must return `false`, never crash the request.
// =============================================================================

function safeCompare(expected: string, received: string): boolean {
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(received);
  if (expectedBuf.length !== receivedBuf.length) return false;
  try {
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
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

  return safeCompare(expectedSignature, signature);
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
