import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseWith } from "@/lib/api/validation";

const Schema = z.object({
  name: z.string().min(2),
  age: z.number().int(),
});

describe("parseWith", () => {
  it("returns ok with typed data for valid input", () => {
    const result = parseWith(Schema, { name: "Aditya", age: 30 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ name: "Aditya", age: 30 });
  });

  it("returns a VALIDATION_ERROR failure with field issues for invalid input", () => {
    const result = parseWith(Schema, { name: "A", age: "oops" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.issues && result.issues.length).toBeGreaterThan(0);
      expect(result.issues?.[0]?.path).toBeTypeOf("string");
    }
  });
});
