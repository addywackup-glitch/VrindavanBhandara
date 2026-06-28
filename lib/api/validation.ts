// =============================================================================
// VRINDAVAN BHANDARA — Validation Bridge (Zod -> ServiceResult)
// Source: 09-security-standards.md — "Input Validation mandatory"
//
// Single choke-point that turns a Zod parse into a typed ServiceResult, so
// every service validates the same way and emits the same field-issue shape.
// =============================================================================

import type { ZodType } from "zod";
import { fail, ok, type FieldIssue, type ServiceResult } from "@/lib/api/result";

export function parseWith<T>(
  schema: ZodType<T>,
  data: unknown
): ServiceResult<T> {
  const result = schema.safeParse(data);
  if (result.success) return ok(result.data);

  const issues: FieldIssue[] = result.error.issues.map((issue) => ({
    path: issue.path.map(String).join(".") || "(root)",
    message: issue.message,
  }));

  return fail(
    "VALIDATION_ERROR",
    issues[0]?.message ?? "Validation failed",
    issues
  );
}
