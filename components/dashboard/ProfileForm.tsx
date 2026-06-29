"use client";

// =============================================================================
// ProfileForm — client component for editing user profile & changing password
// Uses Server Actions (updateProfileAction, changePasswordAction)
// =============================================================================

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { updateProfileAction, changePasswordAction } from "@/app/actions/profile";

// ── Schemas ───────────────────────────────────────────────────────────────────

const ProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number (no +91)")
    .optional()
    .or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
});

const PasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z
      .string()
      .min(8, "Minimum 8 characters")
      .max(128)
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/[a-z]/, "Must include a lowercase letter")
      .regex(/[0-9]/, "Must include a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileFields = z.infer<typeof ProfileSchema>;
type PasswordFields = z.infer<typeof PasswordSchema>;

// ── Sub-components ────────────────────────────────────────────────────────────

function FormField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      {children}
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function StatusBanner({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={type === "success" ? "auth-success-alert" : "auth-error-alert"}
      role="status"
      aria-live="polite"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {type === "success" ? (
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" />
        ) : (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </>
        )}
      </svg>
      {message}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProfileForm({
  initialData,
  hasPassword,
}: {
  initialData: { name: string; email: string; phone: string; city: string };
  hasPassword: boolean;
}) {
  // Profile form state
  const [profileStatus, setProfileStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: profileIsSubmitting },
  } = useForm<ProfileFields>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: initialData.name,
      phone: initialData.phone,
      city: initialData.city,
    },
  });

  // Password form state
  const [pwdStatus, setPwdStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

  const {
    register: pwdRegister,
    handleSubmit: handlePwdSubmit,
    reset: resetPwd,
    formState: { errors: pwdErrors, isSubmitting: pwdIsSubmitting },
  } = useForm<PasswordFields>({
    resolver: zodResolver(PasswordSchema),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const onProfileSubmit = async (data: ProfileFields) => {
    setProfileStatus(null);
    try {
      const result = await updateProfileAction(data);
      setProfileStatus({ type: result.ok ? "success" : "error", message: result.ok ? result.message : result.error });
    } catch {
      setProfileStatus({ type: "error", message: "Something went wrong. Please try again." });
    }
  };

  const onPwdSubmit = async (data: PasswordFields) => {
    setPwdStatus(null);
    try {
      const result = await changePasswordAction(data);
      if (result.ok) {
        setPwdStatus({ type: "success", message: result.message });
        resetPwd();
      } else {
        setPwdStatus({ type: "error", message: result.error });
      }
    } catch {
      setPwdStatus({ type: "error", message: "Something went wrong. Please try again." });
    }
  };

  const eyeIcon = (open: boolean) => (
    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: "currentColor", fill: "none", strokeWidth: 1.5 }} aria-hidden="true">
      {open ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* ── Profile Information ──────────────────────────────── */}
      <div className="db-detail-card">
        <div className="db-detail-card-header">Profile Information</div>
        <div className="db-detail-card-body">
          <AnimatePresence>{profileStatus && <StatusBanner {...profileStatus} />}</AnimatePresence>

          <form onSubmit={handleProfileSubmit(onProfileSubmit)} noValidate>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
              {/* Name */}
              <FormField id="profile-name" label="Full Name" error={profileErrors.name?.message}>
                <input
                  id="profile-name"
                  type="text"
                  autoComplete="name"
                  className={`input${profileErrors.name ? " error" : ""}`}
                  aria-required="true"
                  aria-invalid={!!profileErrors.name}
                  {...profileRegister("name")}
                />
              </FormField>

              {/* Email (read-only) */}
              <FormField id="profile-email" label="Email Address" hint="Email cannot be changed.">
                <input
                  id="profile-email"
                  type="email"
                  value={initialData.email}
                  className="input"
                  readOnly
                  aria-readonly="true"
                  style={{ opacity: 0.65, cursor: "not-allowed" }}
                />
              </FormField>

              {/* Phone */}
              <FormField id="profile-phone" label="Mobile Number" hint="10-digit number without +91" error={profileErrors.phone?.message}>
                <input
                  id="profile-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="9876543210"
                  className={`input${profileErrors.phone ? " error" : ""}`}
                  aria-invalid={!!profileErrors.phone}
                  {...profileRegister("phone")}
                />
              </FormField>

              {/* City */}
              <FormField id="profile-city" label="City" error={profileErrors.city?.message}>
                <input
                  id="profile-city"
                  type="text"
                  autoComplete="address-level2"
                  placeholder="e.g. Mathura"
                  className={`input${profileErrors.city ? " error" : ""}`}
                  aria-invalid={!!profileErrors.city}
                  {...profileRegister("city")}
                />
              </FormField>
            </div>

            <button
              type="submit"
              className="auth-btn-submit"
              style={{ width: "auto", padding: "0.75rem 2rem" }}
              disabled={profileIsSubmitting}
              aria-busy={profileIsSubmitting}
            >
              {profileIsSubmitting ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── Change Password ──────────────────────────────────── */}
      <div className="db-detail-card">
        <div className="db-detail-card-header">Change Password</div>
        <div className="db-detail-card-body">
          {!hasPassword ? (
            <div style={{ padding: "1rem", background: "var(--n-50)", borderRadius: "var(--radius-sm)", fontSize: "0.875rem", color: "var(--muted)" }}>
              Your account uses Google sign-in. Password management is handled by Google.
            </div>
          ) : (
            <>
              <AnimatePresence>{pwdStatus && <StatusBanner {...pwdStatus} />}</AnimatePresence>

              <form onSubmit={handlePwdSubmit(onPwdSubmit)} noValidate>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem", maxWidth: 400, marginBottom: "1.5rem" }}>
                  {/* Current password */}
                  <FormField id="current-pwd" label="Current Password" error={pwdErrors.currentPassword?.message}>
                    <div className="auth-input-wrap">
                      <input
                        id="current-pwd"
                        type={showPwd.current ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter current password"
                        className={`input${pwdErrors.currentPassword ? " error" : ""}`}
                        style={{ paddingRight: "2.75rem" }}
                        aria-required="true"
                        {...pwdRegister("currentPassword")}
                      />
                      <button type="button" className="auth-input-suffix" onClick={() => setShowPwd((v) => ({ ...v, current: !v.current }))} aria-label={showPwd.current ? "Hide" : "Show"}>
                        {eyeIcon(showPwd.current)}
                      </button>
                    </div>
                  </FormField>

                  {/* New password */}
                  <FormField id="new-pwd" label="New Password" hint="Min. 8 chars, uppercase, lowercase, number" error={pwdErrors.newPassword?.message}>
                    <div className="auth-input-wrap">
                      <input
                        id="new-pwd"
                        type={showPwd.new ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        className={`input${pwdErrors.newPassword ? " error" : ""}`}
                        style={{ paddingRight: "2.75rem" }}
                        aria-required="true"
                        {...pwdRegister("newPassword")}
                      />
                      <button type="button" className="auth-input-suffix" onClick={() => setShowPwd((v) => ({ ...v, new: !v.new }))} aria-label={showPwd.new ? "Hide" : "Show"}>
                        {eyeIcon(showPwd.new)}
                      </button>
                    </div>
                  </FormField>

                  {/* Confirm password */}
                  <FormField id="confirm-pwd" label="Confirm New Password" error={pwdErrors.confirmPassword?.message}>
                    <div className="auth-input-wrap">
                      <input
                        id="confirm-pwd"
                        type={showPwd.confirm ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Repeat new password"
                        className={`input${pwdErrors.confirmPassword ? " error" : ""}`}
                        style={{ paddingRight: "2.75rem" }}
                        aria-required="true"
                        {...pwdRegister("confirmPassword")}
                      />
                      <button type="button" className="auth-input-suffix" onClick={() => setShowPwd((v) => ({ ...v, confirm: !v.confirm }))} aria-label={showPwd.confirm ? "Hide" : "Show"}>
                        {eyeIcon(showPwd.confirm)}
                      </button>
                    </div>
                  </FormField>
                </div>

                <button
                  type="submit"
                  className="auth-btn-submit"
                  style={{ width: "auto", padding: "0.75rem 2rem" }}
                  disabled={pwdIsSubmitting}
                  aria-busy={pwdIsSubmitting}
                >
                  {pwdIsSubmitting ? (
                    <>
                      <span className="auth-spinner" aria-hidden="true" />
                      Updating…
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
