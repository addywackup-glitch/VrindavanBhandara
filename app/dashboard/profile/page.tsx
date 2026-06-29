// =============================================================================
// Profile Page — Server shell that loads current user data
// Interactive form handled by ProfileForm client component
// =============================================================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ProfileForm } from "@/components/dashboard/ProfileForm";

export const metadata: Metadata = { title: "Profile — Vrindavan Bhandara" };

async function getUserProfile(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        passwordHash: true,
        createdAt: true,
        image: true,
        _count: { select: { bookings: true } },
      },
    });
  } catch {
    return null;
  }
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard/profile");

  const user = await getUserProfile(session.user.id);
  if (!user) redirect("/dashboard");

  const hasPassword = !!user.passwordHash;
  const memberSince = user.createdAt.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.015em", color: "var(--fg)", marginBottom: "0.375rem" }}>
          My Profile
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
          Member since {memberSince} · {user._count.bookings} seva{user._count.bookings !== 1 ? "s" : ""} booked
        </p>
      </div>

      <ProfileForm
        initialData={{
          name: user.name ?? "",
          email: user.email ?? "",
          phone: user.phone ?? "",
          city: user.city ?? "",
        }}
        hasPassword={hasPassword}
      />
    </>
  );
}
