// =============================================================================
// VRINDAVAN BHANDARA — Typed Domain Errors
// Source: Phase 2 §9 — "Replace generic try/catch with typed domain errors"
//
// Every domain error extends ServiceError, so it already carries an ErrorCode
// and converts to the standard API envelope via `.toResult()`. Services THROW
// these; the boundary (`execute` / route handlers) catches and maps them to a
// consistent ServiceResult. This keeps one error system end-to-end.
// =============================================================================

import { ServiceError, type FieldIssue } from "@/lib/api/result";

export class ValidationError extends ServiceError {
  constructor(message = "Validation failed", issues?: FieldIssue[]) {
    super("VALIDATION_ERROR", message, issues);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends ServiceError {
  constructor(message = "Authentication required.") {
    super("UNAUTHORIZED", message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends ServiceError {
  constructor(message = "You do not have permission to perform this action.") {
    super("FORBIDDEN", message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends ServiceError {
  constructor(entity = "Resource") {
    super("NOT_FOUND", `${entity} not found.`);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ServiceError {
  constructor(message = "The request conflicts with the current state.") {
    super("CONFLICT", message);
    this.name = "ConflictError";
  }
}

/** A booking lifecycle transition or state rule was violated. */
export class BookingConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
    this.name = "BookingConflictError";
  }
}

export class PaymentError extends ServiceError {
  constructor(message = "The payment could not be processed.") {
    super("PAYMENT_ERROR", message);
    this.name = "PaymentError";
  }
}

export class RefundError extends ServiceError {
  constructor(message = "The refund could not be processed.") {
    super("PAYMENT_ERROR", message);
    this.name = "RefundError";
  }
}

export class StorageError extends ServiceError {
  constructor(message = "A storage operation failed.") {
    super("INTERNAL_ERROR", message);
    this.name = "StorageError";
  }
}

export class RateLimitError extends ServiceError {
  constructor(message = "Rate limit exceeded. Please slow down.") {
    super("RATE_LIMITED", message);
    this.name = "RateLimitError";
  }
}
