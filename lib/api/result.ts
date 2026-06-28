// =============================================================================
// VRINDAVAN BHANDARA — Typed Service Result
// Source: 11-coding-standards.md — "Strict TypeScript", "100% typed APIs", "No any"
//
// A framework-agnostic result type used by the entire backend service layer.
// Services NEVER import Next.js / React. They return a discriminated union so
// callers (API routes, Server Actions, cron jobs, tests) can branch exhaustively
// without try/catch noise leaking business logic into the transport layer.
// =============================================================================

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYMENT_ERROR"
  | "INTERNAL_ERROR";

/** A single field-level validation issue (mirrors Zod issue shape, serializable). */
export type FieldIssue = {
  path: string;
  message: string;
};

export type ServiceSuccess<T> = {
  ok: true;
  data: T;
  message?: string;
};

export type ServiceFailure = {
  ok: false;
  code: ErrorCode;
  error: string;
  issues?: FieldIssue[];
};

/** Discriminated union returned by every service function. */
export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

export function ok<T>(data: T, message?: string): ServiceSuccess<T> {
  return { ok: true, data, message };
}

export function fail(
  code: ErrorCode,
  error: string,
  issues?: FieldIssue[]
): ServiceFailure {
  return { ok: false, code, error, issues };
}

/**
 * A throwable error carrying a typed code. Used only for genuinely exceptional
 * paths inside a service; the boundary helpers convert it back into a
 * ServiceFailure so the transport layer never sees raw exceptions.
 */
export class ServiceError extends Error {
  readonly code: ErrorCode;
  readonly issues?: FieldIssue[];

  constructor(code: ErrorCode, message: string, issues?: FieldIssue[]) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.issues = issues;
  }

  toResult(): ServiceFailure {
    return fail(this.code, this.message, this.issues);
  }
}

/** Type guard for success results. */
export function isOk<T>(result: ServiceResult<T>): result is ServiceSuccess<T> {
  return result.ok;
}
