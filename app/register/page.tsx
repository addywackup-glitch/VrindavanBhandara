"use client";

// =============================================================================
// Register Page — pixel-matches design_v1/register.html
// Two-column: brand panel (left, desktop only) + form panel (right)
// Uses registerAction Server Action → auto sign-in on success
// =============================================================================

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth/client";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { registerAction } from "@/app/actions/auth";
import {
  getAuthError,
  getPasswordStrength,
  PASSWORD_STRENGTH_LABELS,
  PASSWORD_STRENGTH_COLORS,
} from "@/lib/auth-errors";

// ── Zod schema — mirrors backend RegisterServiceSchema ────────────────────────
const RegisterSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number (without +91)")
      .or(z.literal("")),
    email: z.string().email("Enter a valid email address").max(255),
    password: z
      .string()
      .min(8, "Minimum 8 characters")
      .max(128)
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/[a-z]/, "Must include a lowercase letter")
      .regex(/[0-9]/, "Must include a number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.boolean().refine((v) => v === true, { message: "You must accept the terms" }),
    newsletter: z.boolean().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFields = z.infer<typeof RegisterSchema>;

// ── Brand panel ───────────────────────────────────────────────────────────────

function BrandPanel() {
  const benefits = [
    {
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      text: "Track all your Seva bookings in one place",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      ),
      text: "Permanently download your Seva photos and videos",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      ),
      text: "Download digital Seva certificates",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
      text: "WhatsApp updates for every upcoming Seva",
    },
  ];

  return (
    <div className="auth-brand-panel" aria-hidden="true">
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

      {/* Content */}
      <div className="auth-brand-content">
        <blockquote className="auth-brand-quote">
          &ldquo;Creating your account takes 2 minutes. Your first Seva can be today.&rdquo;
        </blockquote>
        <p className="auth-brand-sub">
          A free account gives you access to your personal Seva dashboard, where you can
          track all your bookings, download proof media, and manage your profile.
        </p>
        <div className="auth-brand-benefits">
          {benefits.map((b, i) => (
            <div key={i} className="auth-brand-benefit">
              <div className="auth-brand-benefit-icon">{b.icon}</div>
              <span className="auth-brand-benefit-text">{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="auth-brand-footer-note">Free forever · No spam · Cancel anytime</p>
    </div>
  );
}

// ── Password strength meter ───────────────────────────────────────────────────

function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  const label = PASSWORD_STRENGTH_LABELS[strength];
  const color = PASSWORD_STRENGTH_COLORS[strength];

  if (!password) return null;

  return (
    <div className="pwd-strength" role="status" aria-live="polite" aria-label={`Password strength: ${label || "not assessed"}`}>
      <div className="pwd-bar" aria-hidden="true">
        <div
          className="pwd-fill"
          style={{
            width: `${(strength / 4) * 100}%`,
            background: color,
            transition: "width 0.3s ease, background 0.3s ease",
          }}
        />
      </div>
      {label && (
        <p className="pwd-label" style={{ color }}>
          {label}
        </p>
      )}
    </div>
  );
}

// ── Eye icon ──────────────────────────────────────────────────────────────────

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

// ── Form ──────────────────────────────────────────────────────────────────────

function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<{
    title: string;
    message: string;
    action?: { label: string; href: string };
  } | null>(null);
  const [success, setSuccess] = useState(false);
  const firstNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>({
    resolver: zodResolver(RegisterSchema),
    mode: "onBlur",
    defaultValues: { newsletter: false },
  });

  const passwordValue = useWatch({ control, name: "password", defaultValue: "" });
  const { ref: firstNameFormRef, ...firstNameRest } = register("firstName");

  const onSubmit = async (data: RegisterFields) => {
    setSubmitError(null);

    try {
      const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;

      const result = await registerAction({
        name: fullName,
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim() || undefined,
        password: data.password,
      });

      if (!result.ok) {
        const errInfo = getAuthError(result.code, "register");
        setSubmitError(errInfo);
        return;
      }

      setSuccess(true);

      // Auto sign-in after successful registration
      const signInResult = await signIn("credentials", {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login?registered=1");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setSubmitError(getAuthError("NETWORK_ERROR", "register"));
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
            Create your<br />
            <em>free account</em>
          </h1>
          <p className="auth-form-sub">
            Already have an account?{" "}
            <Link href="/login" className="auth-form-link">
              Sign in
            </Link>
          </p>
        </div>

        {/* Error banner */}
        {submitError && (
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
            <span>
              <strong>{submitError.title}.</strong> {submitError.message}
              {submitError.action && (
                <>
                  {" "}
                  <Link href={submitError.action.href} className="auth-form-link">
                    {submitError.action.label}
                  </Link>
                </>
              )}
            </span>
          </motion.div>
        )}

        {/* Success state */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="auth-success-alert"
            role="status"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
            Account created! Signing you in…
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Create account form">
          {/* First + Last name grid */}
          <div className="auth-form-grid">
            <div className="auth-form-group">
              <label htmlFor="firstName" className="form-label">
                First Name <span className="auth-required" aria-hidden="true">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="Ramesh"
                className={`input${errors.firstName ? " error" : ""}`}
                aria-required="true"
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? "err-firstName" : undefined}
                {...firstNameRest}
                ref={(el) => {
                  firstNameFormRef(el);
                  (firstNameRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                }}
              />
              {errors.firstName && (
                <span id="err-firstName" className="form-error" role="alert">
                  {errors.firstName.message}
                </span>
              )}
            </div>

            <div className="auth-form-group">
              <label htmlFor="lastName" className="form-label">
                Last Name <span className="auth-required" aria-hidden="true">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Sharma"
                className={`input${errors.lastName ? " error" : ""}`}
                aria-required="true"
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? "err-lastName" : undefined}
                {...register("lastName")}
              />
              {errors.lastName && (
                <span id="err-lastName" className="form-error" role="alert">
                  {errors.lastName.message}
                </span>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="auth-form-group auth-form-group-full">
            <label htmlFor="phone" className="form-label">
              Mobile Number{" "}
              <span className="auth-optional">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="9876543210"
              className={`input${errors.phone ? " error" : ""}`}
              aria-invalid={!!errors.phone}
              aria-describedby="phone-hint err-phone"
              {...register("phone")}
            />
            <span id="phone-hint" className="form-hint">
              10 digits without country code. We&apos;ll send Seva updates via WhatsApp.
            </span>
            {errors.phone && (
              <span id="err-phone" className="form-error" role="alert">
                {errors.phone.message}
              </span>
            )}
          </div>

          {/* Email */}
          <div className="auth-form-group auth-form-group-full">
            <label htmlFor="reg-email" className="form-label">
              Email Address <span className="auth-required" aria-hidden="true">*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder="ramesh@example.com"
              className={`input${errors.email ? " error" : ""}`}
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "err-email" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <span id="err-email" className="form-error" role="alert">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="auth-form-group auth-form-group-full">
            <label htmlFor="reg-password" className="form-label">
              Password <span className="auth-required" aria-hidden="true">*</span>
            </label>
            <div className="auth-input-wrap">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                className={`input${errors.password ? " error" : ""}`}
                style={{ paddingRight: "2.75rem" }}
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby="pwd-strength-status err-password pwd-rules"
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
            <div id="pwd-strength-status">
              <PasswordStrengthMeter password={passwordValue ?? ""} />
            </div>
            <ul id="pwd-rules" className="auth-pwd-rules" aria-label="Password requirements">
              {[
                { rule: "8+ characters", met: (passwordValue?.length ?? 0) >= 8 },
                { rule: "Uppercase letter", met: /[A-Z]/.test(passwordValue ?? "") },
                { rule: "Lowercase letter", met: /[a-z]/.test(passwordValue ?? "") },
                { rule: "Number (0–9)", met: /[0-9]/.test(passwordValue ?? "") },
              ].map((r) => (
                <li key={r.rule} style={{ color: r.met ? "var(--success)" : "var(--subtle)" }}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" width="12" height="12">
                    {r.met ? (
                      <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    ) : (
                      <circle cx="12" cy="12" r="3" fill="currentColor" />
                    )}
                  </svg>
                  {r.rule}
                </li>
              ))}
            </ul>
            {errors.password && (
              <span id="err-password" className="form-error" role="alert">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="auth-form-group auth-form-group-full">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password <span className="auth-required" aria-hidden="true">*</span>
            </label>
            <div className="auth-input-wrap">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat your password"
                className={`input${errors.confirmPassword ? " error" : ""}`}
                style={{ paddingRight: "2.75rem" }}
                aria-required="true"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "err-confirm" : undefined}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                className="auth-input-suffix"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {errors.confirmPassword && (
              <span id="err-confirm" className="form-error" role="alert">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          {/* Terms */}
          <div className="auth-form-group auth-form-group-full">
            <label className="auth-terms-row">
              <input
                type="checkbox"
                className="auth-checkbox"
                aria-required="true"
                aria-invalid={!!errors.terms}
                aria-describedby={errors.terms ? "err-terms" : undefined}
                {...register("terms")}
              />
              <span className="auth-terms-text">
                I agree to the{" "}
                <Link href="/terms" target="_blank" rel="noopener">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy-policy" target="_blank" rel="noopener">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.terms && (
              <span id="err-terms" className="form-error" role="alert">
                {errors.terms.message}
              </span>
            )}
          </div>

          {/* Newsletter */}
          <div className="auth-form-group auth-form-group-full" style={{ marginBottom: "1.5rem" }}>
            <label className="auth-terms-row">
              <input
                type="checkbox"
                className="auth-checkbox"
                {...register("newsletter")}
              />
              <span className="auth-terms-text">
                Send me updates about Sevas, festivals, and special offerings
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="auth-btn-submit"
            disabled={isSubmitting || success}
            aria-busy={isSubmitting}
          >
            {isSubmitting || success ? (
              <>
                <span className="auth-spinner" aria-hidden="true" />
                {success ? "Signing you in…" : "Creating Account…"}
              </>
            ) : (
              <>
                Create Free Account
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        <p className="auth-form-footer">
          <Link href="/">← Return to home</Link>
        </p>
      </motion.div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  return (
    <div className="auth-layout">
      <BrandPanel />
      <RegisterForm />
    </div>
  );
}
