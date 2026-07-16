"use server";

// =============================================================================
// Profile Server Actions — update profile; change password via Supabase Auth
// =============================================================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const ProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
    .optional()
    .or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
});

const PasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Minimum 8 characters")
      .max(128)
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/[a-z]/, "Must include a lowercase letter")
      .regex(/[0-9]/, "Must include a number"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ProfileActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string; field?: string };

export async function updateProfileAction(input: unknown): Promise<ProfileActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: "Not authenticated" };

    const parsed = ProfileSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return { ok: false, error: first.message, field: String(first.path[0] ?? "") };
    }

    const { name, phone, city } = parsed.data;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone: phone || null,
        city: city || null,
      },
    });

    return { ok: true, message: "Profile updated successfully." };
  } catch (error) {
    console.error("[updateProfileAction]", error);
    return { ok: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function changePasswordAction(input: unknown): Promise<ProfileActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: "Not authenticated" };

    const parsed = PasswordSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return { ok: false, error: first.message, field: String(first.path[0] ?? "") };
    }

    const { currentPassword, newPassword } = parsed.data;

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, supabaseUserId: true },
    });

    if (!dbUser?.email) {
      return { ok: false, error: "Account not found." };
    }

    const supabase = await createClient();

    // Verify current password by attempting sign-in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: dbUser.email,
      password: currentPassword,
    });

    if (verifyError) {
      return {
        ok: false,
        error: "Current password is incorrect.",
        field: "currentPassword",
      };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      // Fallback via service role if session update fails
      if (dbUser.supabaseUserId) {
        const admin = createAdminClient();
        const { error: adminErr } = await admin.auth.admin.updateUserById(
          dbUser.supabaseUserId,
          { password: newPassword }
        );
        if (adminErr) {
          return { ok: false, error: adminErr.message };
        }
      } else {
        return { ok: false, error: updateError.message };
      }
    }

    return { ok: true, message: "Password changed successfully." };
  } catch (error) {
    console.error("[changePasswordAction]", error);
    return { ok: false, error: "An unexpected error occurred. Please try again." };
  }
}
