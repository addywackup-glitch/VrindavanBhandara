import { describe, it, expect, beforeAll } from "vitest";
import crypto from "node:crypto";
import { verifyRazorpaySignature } from "@/features/payments/razorpay";

const SECRET = "test_secret_key";

describe("verifyRazorpaySignature", () => {
  beforeAll(() => {
    process.env.RAZORPAY_KEY_SECRET = SECRET;
  });

  it("accepts a correctly computed HMAC signature", () => {
    const orderId = "order_ABC123";
    const paymentId = "pay_XYZ789";
    const signature = crypto
      .createHmac("sha256", SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(verifyRazorpaySignature({ orderId, paymentId, signature })).toBe(true);
  });

  it("rejects a forged signature of equal length", () => {
    const valid = crypto
      .createHmac("sha256", SECRET)
      .update("order_1|pay_1")
      .digest("hex");
    const forged = "f".repeat(valid.length);
    expect(verifyRazorpaySignature({ orderId: "order_1", paymentId: "pay_1", signature: forged })).toBe(false);
  });

  it("does not throw on a length-mismatched signature (regression: timingSafeEqual)", () => {
    expect(() =>
      verifyRazorpaySignature({ orderId: "o", paymentId: "p", signature: "short" })
    ).not.toThrow();
    expect(verifyRazorpaySignature({ orderId: "o", paymentId: "p", signature: "short" })).toBe(false);
  });
});
