// =============================================================================
// VRINDAVAN BHANDARA — HTTP Boundary Helpers
// Source: 11-coding-standards.md — "100% typed APIs", "Error boundaries"
//
// The ONLY place that knows about both the service layer (ServiceResult) and
// Next.js transport (NextResponse / auth / headers). Route handlers stay thin:
// resolve actor -> parse body -> call service -> `respond(result)`.
//
// The wire shape is kept backward-compatible with the existing `ApiResponse<T>`
// contract ({ success, data } | { success:false, error, code }) so the frontend
// continues to work unchanged.
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Actor } from "@/lib/services/actor";
import { hasPermission, type Permission } from "@/lib/rbac";
import { AuthenticationError, AuthorizationError } from "@/lib/errors";
import {
  fail,
  ServiceError,
  type ErrorCode,
  type ServiceResult,
} from "@/lib/api/result";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  PAYMENT_ERROR: 402,
  INTERNAL_ERROR: 500,
};

export function statusForCode(code: ErrorCode): number {
  return STATUS_BY_CODE[code];
}

/** Convert a ServiceResult into the wire `ApiResponse` shape + correct status. */
export function respond<T>(
  result: ServiceResult<T>,
  init?: { successStatus?: number; headers?: HeadersInit }
): NextResponse {
  if (result.ok) {
    return NextResponse.json(
      { success: true, data: result.data, message: result.message },
      { status: init?.successStatus ?? 200, headers: init?.headers }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: result.error,
      code: result.code,
      ...(result.issues ? { issues: result.issues } : {}),
    },
    { status: STATUS_BY_CODE[result.code], headers: init?.headers }
  );
}

/** Resolve the authenticated principal, or null if unauthenticated. */
export async function getActor(): Promise<Actor | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    userId: session.user.id,
    role: session.user.role,
    adminRole: session.user.adminRole ?? null,
    name: session.user.name,
  };
}

/** Resolve the authenticated principal or throw AuthenticationError. */
export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) throw new AuthenticationError();
  return actor;
}

/**
 * Resolve an authenticated ADMIN principal, optionally enforcing a specific
 * permission. The single source of admin RBAC for every admin route.
 */
export async function requireAdmin(permission?: Permission): Promise<Actor> {
  const actor = await requireActor();
  if (actor.role !== "ADMIN") throw new AuthorizationError();
  if (permission) {
    if (!actor.adminRole || !hasPermission(actor.adminRole, permission)) {
      throw new AuthorizationError();
    }
  }
  return actor;
}

/**
 * Standard route boundary: run a handler that returns a ServiceResult (or
 * throws a typed domain error), and map either outcome to the uniform envelope.
 */
export async function handle<T>(
  fn: () => Promise<ServiceResult<T>>,
  init?: { successStatus?: number; headers?: HeadersInit }
): Promise<NextResponse> {
  try {
    return respond(await fn(), init);
  } catch (error) {
    return respond(toFailure(error));
  }
}

/** Resolve the best-effort client IP from a Headers object. */
export function ipFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}

/** Resolve the best-effort client IP for rate limiting / audit. */
export function getClientIp(request: Request): string {
  return ipFromHeaders(request.headers);
}

/** Safely parse a JSON body; returns a typed failure instead of throwing. */
export async function parseJsonBody(
  request: Request
): Promise<ServiceResult<unknown>> {
  try {
    const body: unknown = await request.json();
    return { ok: true, data: body };
  } catch {
    return fail("VALIDATION_ERROR", "Invalid or malformed JSON body");
  }
}

/**
 * Normalize any thrown value into a ServiceFailure. Use at the outer edge of a
 * route/action so a stray exception becomes a clean 500 rather than a leak.
 */
export function toFailure(error: unknown): ServiceResult<never> {
  if (error instanceof ServiceError) return error.toResult();
  console.error("[UNHANDLED_BACKEND_ERROR]", error);
  return fail("INTERNAL_ERROR", "An unexpected error occurred. Please try again.");
}
