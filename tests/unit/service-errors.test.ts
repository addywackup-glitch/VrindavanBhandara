import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { toServiceFailure } from "@/lib/api/service";
import { NotFoundError } from "@/lib/errors";

describe("toServiceFailure", () => {
  it("passes typed domain errors through with their code", () => {
    const r = toServiceFailure(new NotFoundError("Booking"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("NOT_FOUND");
  });

  it("maps Prisma P2002 (unique constraint) to CONFLICT", () => {
    const e = new Prisma.PrismaClientKnownRequestError("Unique failed", {
      code: "P2002",
      clientVersion: "test",
      meta: { target: ["email"] },
    });
    const r = toServiceFailure(e);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("CONFLICT");
  });

  it("maps Prisma P2025 (record not found) to NOT_FOUND", () => {
    const e = new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: "test",
    });
    const r = toServiceFailure(e);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("NOT_FOUND");
  });

  it("maps unknown errors to INTERNAL_ERROR without leaking details", () => {
    const r = toServiceFailure(new Error("boom: secret stack"));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("INTERNAL_ERROR");
      expect(r.error).not.toContain("secret");
    }
  });
});
