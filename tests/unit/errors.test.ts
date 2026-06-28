import { describe, it, expect } from "vitest";
import {
  AuthenticationError,
  AuthorizationError,
  BookingConflictError,
  NotFoundError,
  PaymentError,
  RateLimitError,
  RefundError,
  ValidationError,
} from "@/lib/errors";

describe("domain errors map to API error codes", () => {
  it("ValidationError -> VALIDATION_ERROR", () => {
    expect(new ValidationError().toResult().code).toBe("VALIDATION_ERROR");
  });
  it("AuthenticationError -> UNAUTHORIZED", () => {
    expect(new AuthenticationError().toResult().code).toBe("UNAUTHORIZED");
  });
  it("AuthorizationError -> FORBIDDEN", () => {
    expect(new AuthorizationError().toResult().code).toBe("FORBIDDEN");
  });
  it("NotFoundError -> NOT_FOUND and includes entity", () => {
    const r = new NotFoundError("Booking").toResult();
    expect(r.code).toBe("NOT_FOUND");
    expect(r.error).toContain("Booking");
  });
  it("BookingConflictError -> CONFLICT", () => {
    expect(new BookingConflictError("bad transition").toResult().code).toBe("CONFLICT");
  });
  it("PaymentError & RefundError -> PAYMENT_ERROR", () => {
    expect(new PaymentError().toResult().code).toBe("PAYMENT_ERROR");
    expect(new RefundError().toResult().code).toBe("PAYMENT_ERROR");
  });
  it("RateLimitError -> RATE_LIMITED", () => {
    expect(new RateLimitError().toResult().code).toBe("RATE_LIMITED");
  });
});
