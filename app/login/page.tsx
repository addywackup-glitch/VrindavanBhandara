"use client";

// =============================================================================
// Login Page — pixel-matches design_v1/login.html
// Two-column: brand panel (left, desktop only) + form panel (right)
// Uses real NextAuth credentials + Google OAuth
// =============================================================================

import { Suspense, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { getAuthError } from "@/lib/auth-errors";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

// ── Zod schema (client-side only — mirrors backend CredentialsSchema) ─────────
const LoginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFields = z.infer<typeof LoginSchema>;

// ── Brand panel (left column) ────────────────────────────────────────────────

function BrandPanel() {
  const stats = [
    { num: "5,200+", label: "Sevas Performed" },
    { num: "4.9★", label: "Average Rating" },
    { num: "12 Yrs", label: "of Service" },
  ];

  return (
    <div className="auth-brand-panel" aria-hidden="true">
      {/* Gradient overlay */}
      <div className="auth-brand-overlay" />

      {/* Logo */}
      <Link href="/" className="auth-brand-logo">
        <div className="auth-brand-logo-mark">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3L3 9v12h6v-7h6v7h6V9L12 3z" />
          </svg>
        </div>
        <span className="auth-brand-logo-text">Vrindavan Bhandara</span>
      </Link>

      {/* Quote + sub */}
      <div className="auth-brand-content">
        <blockquote className="auth-brand-quote">
          &ldquo;The highest form of worship is feeding those who are hungry.&rdquo;
        </blockquote>
        <p className="auth-brand-sub">
          Join thousands of families who trust us to perform their sacred Seva in Vrindavan
          and Mathura — with full documentation and devotion.
        </p>
      </div>

      {/* Stats */}
      <div className="auth-brand-stats">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="auth-brand-stat-num">{s.num}</div>
            <div className="auth-brand-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Eye icon (show/hide password) ────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ── Google icon ───────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeCallbackUrl(params.get("callbackUrl"));
  const expired = params.get("error") === "SessionRequired";

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(
    expired ? "Your session has expired. Please sign in again." : null
  );
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  // Auto-focus email on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { rememberMe: false },
  });

  const { ref: emailFormRef, ...emailRest } = register("email");

  const onSubmit = async (data: LoginFields) => {
    setAuthError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        const errInfo = getAuthError(result.error, "login");
        setAuthError(errInfo.message);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setAuthError(getAuthError("NETWORK_ERROR", "login").message);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="auth-form-panel">
      <motion.div
        className="auth-form-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="auth-form-header">
          <h1 className="auth-form-title">
            Sign in to your<br />
            <em>Seva dashboard</em>
          </h1>
          <p className="auth-form-sub">
            New here?{" "}
            <Link href="/register" className="auth-form-link">
              Create a free account
            </Link>
          </p>
        </div>

        {/* Error banner */}
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="auth-error-alert"
            role="alert"
            aria-live="assertive"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            {authError}
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email */}
          <div className="auth-form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`input${errors.email ? " error" : ""}`}
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "err-email" : undefined}
              {...emailRest}
              ref={(el) => {
                emailFormRef(el);
                (emailRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
              }}
            />
            {errors.email && (
              <span id="err-email" className="form-error" role="alert">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="auth-form-group">
            <label htmlFor="login-password" className="form-label">
              Password
            </label>
            <div className="auth-input-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                className={`input${errors.password ? " error" : ""}`}
                style={{ paddingRight: "2.75rem" }}
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "err-password" : undefined}
                {...register("password")}
              />
              <button
                type="button"
                className="auth-input-suffix"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {errors.password && (
              <span id="err-password" className="form-error" role="alert">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Remember me + forgot password */}
          <div className="auth-form-row-between">
            <label className="auth-check-row">
              <input
                type="checkbox"
                {...register("rememberMe")}
                className="auth-checkbox"
                aria-label="Remember me"
              />
              <span className="auth-check-label">Remember me</span>
            </label>
            <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
              Forgot password? Contact support.
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="auth-btn-submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="auth-spinner" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider" aria-hidden="true">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">or continue with</span>
          <div className="auth-divider-line" />
        </div>

        {/* Google */}
        <button
          type="button"
          className="auth-btn-social"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          aria-label="Continue with Google"
        >
          {isGoogleLoading ? (
            <span className="auth-spinner" aria-hidden="true" />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </button>

        {/* Footer */}
        <p className="auth-form-footer">
          By signing in, you agree to our{" "}
          <Link href="/terms">Terms of Service</Link> and{" "}
          <Link href="/privacy-policy">Privacy Policy</Link>.
          <br />
          <Link href="/">← Return to home</Link>
        </p>
      </motion.div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function LoginContent() {
  return (
    <div className="auth-layout">
      <BrandPanel />
      <LoginForm />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="auth-layout"
          style={{ placeItems: "center" }}
          aria-label="Loading sign in"
        >
          <div className="auth-spinner-large" role="status" aria-label="Loading" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
