// =============================================================================
// VRINDAVAN BHANDARA — Service Execution Helpers
// Source: Phase 2 §2/§7/§9 — clean services, consistent responses, typed errors
//
// `execute` wraps a service body so it can THROW typed domain errors and freely
// use repositories, while the public method still returns a uniform
// ServiceResult. `validate` turns a Zod parse into data-or-throw.
// =============================================================================

import { Prisma } from "@prisma/client";
import type { ZodType } from "zod";
import { parseWith } from "@/lib/api/validation";
import {
  fail,
  ok,
  ServiceError,
  type ServiceResult,
} from "@/lib/api/result";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";

/** Validate input or throw a ValidationError. */
export function validate<T>(schema: ZodType<T>, data: unknown): T {
  const result = parseWith(schema, data);
  if (!result.ok) throw new ValidationError(result.error, result.issues);
  return result.data;
}

/** Map any thrown value into a typed ServiceFailure. */
export function toServiceFailure(error: unknown): ServiceResult<never> {
  if (error instanceof ServiceError) return error.toResult();

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = error.meta?.target;
      const field = Array.isArray(target) ? target.join(", ") : "value";
      return new ConflictError(`A record with this ${field} already exists.`).toResult();
    }
    if (error.code === "P2025") {
      return new NotFoundError("Record").toResult();
    }
    // Column/table missing — schema not pushed to Supabase yet
    if (error.code === "P2022" || error.code === "P2021") {
      return fail(
        "INTERNAL_ERROR",
        "Database schema is out of date. Run `npx prisma db push` against your Supabase database."
      );
    }
  }

  // Prisma "column does not exist" sometimes arrives as a generic driver error
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("does not exist") ||
    message.includes("column") && message.toLowerCase().includes("supabaseuserid")
  ) {
    return fail(
      "INTERNAL_ERROR",
      "Database schema is out of date. Run `npx prisma db push` against your Supabase database."
    );
  }

  console.error("[SERVICE_ERROR]", error);
  return fail("INTERNAL_ERROR", "An unexpected error occurred. Please try again.");
}

/**
 * Run a service body, converting typed throws into a ServiceResult. This is the
 * single place service-level errors are normalized.
 */
export async function execute<T>(
  fn: () => Promise<T>,
  successMessage?: string
): Promise<ServiceResult<T>> {
  try {
    return ok(await fn(), successMessage);
  } catch (error) {
    return toServiceFailure(error);
  }
}
