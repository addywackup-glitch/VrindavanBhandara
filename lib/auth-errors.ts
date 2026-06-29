// =============================================================================
// Auth Error Mapping — maps backend error codes to user-friendly messages
// Source: docs/error-codes.md + NextAuth error values
// =============================================================================

export type AuthErrorContext = "login" | "register";

export type AuthErrorInfo = {
  title: string;
  message: string;
  canRetry: boolean;
  action?: { label: string; href: string };
};

// ── Login errors ──────────────────────────────────────────────────────────────
const LOGIN_ERRORS: Record<string, AuthErrorInfo> = {
  // NextAuth returns this string on credential mismatch
  CredentialsSignin: {
    title: "Invalid credentials",
    message: "The email or password you entered is incorrect. Please try again.",
    canRetry: true,
  },
  // NextAuth error for any signIn failure
  Default: {
    title: "Sign in failed",
    message: "We couldn't sign you in. Please check your details and try again.",
    canRetry: true,
  },
  UNAUTHORIZED: {
    title: "Invalid credentials",
    message: "The email or password you entered is incorrect.",
    canRetry: true,
  },
  RATE_LIMITED: {
    title: "Too many attempts",
    message: "You've made too many sign-in attempts. Please wait 15 minutes before trying again.",
    canRetry: false,
  },
  INTERNAL_ERROR: {
    title: "Server error",
    message: "An unexpected error occurred. Please try again in a moment.",
    canRetry: true,
  },
  NETWORK_ERROR: {
    title: "Connection error",
    message: "Could not reach our server. Please check your internet connection.",
    canRetry: true,
  },
  SessionRequired: {
    title: "Session expired",
    message: "Your session has expired. Please sign in again.",
    canRetry: true,
  },
};

// ── Register errors ───────────────────────────────────────────────────────────
const REGISTER_ERRORS: Record<string, AuthErrorInfo> = {
  CONFLICT: {
    title: "Account already exists",
    message: "An account with this email address already exists.",
    canRetry: false,
    action: { label: "Sign in instead", href: "/login" },
  },
  VALIDATION_ERROR: {
    title: "Invalid information",
    message:
      "Some of the information you entered is not valid. Please review the fields below.",
    canRetry: false,
  },
  RATE_LIMITED: {
    title: "Too many attempts",
    message: "You've made too many registration attempts. Please wait 15 minutes.",
    canRetry: false,
  },
  INTERNAL_ERROR: {
    title: "Registration failed",
    message: "An unexpected error occurred. Please try again in a moment.",
    canRetry: true,
  },
  NETWORK_ERROR: {
    title: "Connection error",
    message: "Could not reach our server. Please check your internet connection.",
    canRetry: true,
  },
};

export function getAuthError(
  code: string | undefined | null,
  context: AuthErrorContext
): AuthErrorInfo {
  const map = context === "login" ? LOGIN_ERRORS : REGISTER_ERRORS;
  const key = code ?? "INTERNAL_ERROR";
  return map[key] ?? map["INTERNAL_ERROR"] ?? {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
    canRetry: true,
  };
}

// Password strength levels — mirrors backend regex rules
export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export const PASSWORD_STRENGTH_LABELS: Record<PasswordStrength, string> = {
  0: "",
  1: "Weak",
  2: "Fair",
  3: "Good",
  4: "Strong",
};

export const PASSWORD_STRENGTH_COLORS: Record<PasswordStrength, string> = {
  0: "var(--n-200)",
  1: "var(--danger)",
  2: "var(--warning)",
  3: "var(--accent)",
  4: "var(--success)",
};

// Mirror backend: min 8 chars, uppercase, lowercase, digit
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  return score as PasswordStrength;
}

// Full Zod schema that mirrors the backend (prevents double round-trips for obvious errors)
export const PASSWORD_RULES_TEXT = [
  "At least 8 characters",
  "One uppercase letter (A–Z)",
  "One lowercase letter (a–z)",
  "One number (0–9)",
];
