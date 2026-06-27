"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof LoginSchema>;

const inputStyle = {
  width: "100%",
  padding: "0.875rem 1rem",
  borderRadius: "0.75rem",
  border: "1px solid rgba(184,153,71,0.3)",
  background: "#FFFFFF",
  color: "#2A2825",
  fontSize: "0.875rem",
  outline: "none",
  transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
};

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setAuthError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError("Invalid email or password. Please try again.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "#F5EEDB" }} // Sandalwood Beige
    >
      {/* Left panel — spiritual illustration */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-end p-16"
        style={{
          background: "linear-gradient(145deg, #8B1E1E, #631212, #4A0D0D)", // Deep Maroon gradient
          borderRight: "1px solid rgba(184,153,71,0.2)",
        }}
      >
        {/* Animated rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[380, 300, 220, 140].map((size, i) => (
            <motion.div
              key={size}
              className="absolute rounded-full border"
              style={{
                width: size,
                height: size,
                borderColor: `rgba(184,153,71,${0.08 + i * 0.04})`, // Antique gold rings
              }}
              animate={{ rotate: i % 2 === 0 ? 360 : -360, scale: [1, 1.02, 1] }}
              transition={{ duration: 30 + i * 10, repeat: Infinity, ease: "linear" }}
            />
          ))}
          {/* Central glow */}
          <div
            className="absolute w-48 h-48 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(184,153,71,0.2), transparent 70%)", filter: "blur(20px)" }}
          />
          <span className="text-8xl relative z-10 animate-float">🪔</span>
        </div>

        {/* Floating particles — deterministic positions seeded by index to avoid impure Math.random() in render */}
        {([
          { w: 5, h: 5, l: 12, t: 18, dur: 5.2, del: 0.4 },
          { w: 3, h: 3, l: 28, t: 74, dur: 6.8, del: 1.1 },
          { w: 6, h: 6, l: 45, t: 33, dur: 4.5, del: 0.7 },
          { w: 2, h: 2, l: 62, t: 88, dur: 7.1, del: 2.0 },
          { w: 4, h: 4, l: 78, t: 12, dur: 5.9, del: 0.2 },
          { w: 3, h: 3, l: 88, t: 55, dur: 6.3, del: 1.5 },
          { w: 5, h: 5, l: 7,  t: 65, dur: 4.8, del: 0.9 },
          { w: 2, h: 2, l: 33, t: 40, dur: 7.4, del: 2.3 },
          { w: 6, h: 6, l: 55, t: 82, dur: 5.1, del: 0.6 },
          { w: 3, h: 3, l: 72, t: 28, dur: 6.6, del: 1.8 },
          { w: 4, h: 4, l: 18, t: 92, dur: 4.9, del: 1.2 },
          { w: 5, h: 5, l: 91, t: 47, dur: 7.0, del: 0.3 },
        ] as const).map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.w,
              height: p.h,
              left: `${p.l}%`,
              top: `${p.t}%`,
              background: i % 2 === 0 ? "rgba(184,153,71,0.6)" : "rgba(255,252,248,0.4)",
            }}
            animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: p.dur, delay: p.del, repeat: Infinity }}
          />
        ))}

        {/* Bottom copy */}
        <div className="relative z-10">
          <blockquote
            className="font-heading text-2xl mb-4 leading-snug"
            style={{ color: "#FFFCF8" }}
          >
            &ldquo;Performing seva is the highest act of devotion — it transforms the giver.&rdquo;
          </blockquote>
          <p className="text-sm font-bold" style={{ color: "#B89947" }}>
            — Vrindavan Bhandara
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-20 bg-white shadow-xl lg:shadow-none z-10 rounded-t-[2.5rem] lg:rounded-none mt-20 lg:mt-0">
        <div className="w-full max-w-md">

          {/* Back */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold mb-10 transition-colors"
              style={{ color: "#8B1E1E" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mb-10"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: "linear-gradient(135deg, #8B1E1E, #B89947)", boxShadow: "0 0 30px rgba(139,30,30,0.2)" }}
            >
              <span className="text-2xl">🪔</span>
            </div>
            <h1
              className="font-heading text-3xl font-bold mb-2"
              style={{ color: "#2A2825" }}
            >
              Welcome back
            </h1>
            <p className="text-sm font-medium" style={{ color: "#4A453F" }}>
              Sign in to your Vrindavan Bhandara account
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            {/* Error */}
            {authError && (
              <div
                className="mb-6 px-4 py-3.5 rounded-xl text-sm flex items-center gap-3 font-semibold"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#B91C1C",
                }}
              >
                <span>⚠️</span>
                {authError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label
                  className="block text-xs font-bold mb-2 tracking-wider uppercase"
                  style={{ color: "#8C702E" }}
                >
                  Email Address
                </label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#8B1E1E";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,30,30,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(184,153,71,0.3)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                {errors.email && (
                  <p className="text-red-600 font-semibold text-xs mt-1.5">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label
                  className="block text-xs font-bold mb-2 tracking-wider uppercase"
                  style={{ color: "#8C702E" }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    style={{ ...inputStyle, paddingRight: "3rem" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#8B1E1E";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,30,30,0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(184,153,71,0.3)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "#8C702E" }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-600 font-semibold text-xs mt-1.5">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01]"
                style={{
                  background: "linear-gradient(135deg, #8B1E1E, #B89947)",
                  boxShadow: "0 6px 20px rgba(139,30,30,0.25)",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : "Sign In →"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-7">
              <div className="flex-1 h-px" style={{ background: "rgba(184,153,71,0.2)" }} />
              <span className="text-xs font-bold" style={{ color: "#B89947" }}>OR</span>
              <div className="flex-1 h-px" style={{ background: "rgba(184,153,71,0.2)" }} />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: "#FFFCF8",
                border: "1px solid rgba(184,153,71,0.3)",
                color: "#2A2825",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(184,153,71,0.05)";
                e.currentTarget.style.borderColor = "rgba(184,153,71,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FFFCF8";
                e.currentTarget.style.borderColor = "rgba(184,153,71,0.3)";
              }}
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            {/* Register link */}
            <p className="text-center text-sm mt-8 font-medium" style={{ color: "#4A453F" }}>
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-bold transition-colors"
                style={{ color: "#8B1E1E" }}
              >
                Create Account
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5EEDB" }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(184,153,71,0.2)", borderTopColor: "#8B1E1E" }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
