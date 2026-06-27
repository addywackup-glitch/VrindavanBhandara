"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^(\+91|91|0)?[6-9]\d{9}$/, "Enter a valid Indian mobile number").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email, phone: data.phone, password: data.password }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Registration failed. Please try again.");
        return;
      }

      // Auto sign in after registration
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20" style={{ background: "#F5EEDB" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center shadow-glow-gold">
              <span className="text-2xl">🪔</span>
            </div>
            <span className="font-heading font-bold text-xl text-charcoal">Vrindavan Bhandara</span>
          </Link>
          <h1 className="font-heading text-2xl text-charcoal">Create Your Account</h1>
          <p className="text-gray-500 text-sm mt-1">Begin your seva journey today</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-luxury p-8"
        >
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Full Name</label>
              <input
                {...register("name")}
                placeholder="Your Name"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-gold-400 focus:outline-none text-sm transition-colors"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Email Address</label>
              <input
                {...register("email")}
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-gold-400 focus:outline-none text-sm transition-colors"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">WhatsApp Number <span className="text-gray-400 text-xs">(optional)</span></label>
              <input
                {...register("phone")}
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-gold-400 focus:outline-none text-sm transition-colors"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1.5">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Password</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 border-gray-200 focus:border-gold-400 focus:outline-none text-sm transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Confirm Password</label>
              <input
                {...register("confirmPassword")}
                type="password"
                placeholder="Repeat your password"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-gold-400 focus:outline-none text-sm transition-colors"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
            </div>

            <p className="text-xs text-gray-400">
              By creating an account you agree to our{" "}
              <Link href="/terms" className="text-gold-600 hover:underline">Terms</Link> and{" "}
              <Link href="/privacy-policy" className="text-gold-600 hover:underline">Privacy Policy</Link>.
            </p>

            <button type="submit" disabled={isSubmitting} className="btn-gold w-full justify-center py-4 text-base disabled:opacity-60">
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Account...</> : "Create Account →"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-gold-600 font-semibold hover:underline">Sign In</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
