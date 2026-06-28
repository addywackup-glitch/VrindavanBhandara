import { describe, it, expect } from "vitest";
import { canTransition } from "@/lib/services/booking.service";

describe("booking status lifecycle (canTransition)", () => {
  it("allows PENDING -> CONFIRMED", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
  });
  it("allows PENDING -> CANCELLED", () => {
    expect(canTransition("PENDING", "CANCELLED")).toBe(true);
  });
  it("blocks PENDING -> COMPLETED", () => {
    expect(canTransition("PENDING", "COMPLETED")).toBe(false);
  });
  it("allows CONFIRMED -> IN_PROGRESS / CANCELLED / REFUNDED", () => {
    expect(canTransition("CONFIRMED", "IN_PROGRESS")).toBe(true);
    expect(canTransition("CONFIRMED", "CANCELLED")).toBe(true);
    expect(canTransition("CONFIRMED", "REFUNDED")).toBe(true);
  });
  it("allows IN_PROGRESS -> COMPLETED", () => {
    expect(canTransition("IN_PROGRESS", "COMPLETED")).toBe(true);
  });
  it("treats same-status as a no-op (idempotent)", () => {
    expect(canTransition("COMPLETED", "COMPLETED")).toBe(true);
  });
  it("blocks transitions out of terminal states", () => {
    expect(canTransition("COMPLETED", "IN_PROGRESS")).toBe(false);
    expect(canTransition("CANCELLED", "CONFIRMED")).toBe(false);
    expect(canTransition("REFUNDED", "CONFIRMED")).toBe(false);
  });
});
