// =============================================================================
// VRINDAVAN BHANDARA — NextAuth v5 Configuration
// Source: PROJECT_RULES.md — "Every protected route must have authorization checks"
// =============================================================================

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { LoginSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import type { SessionUser } from "@/types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { admin: true },
        });

        if (!user || !user.passwordHash) return null;
        if (!user.isActive) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          adminRole: user.admin?.role ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On first sign-in 'user' is populated — copy fields into token
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as SessionUser).role;
        token.adminRole = (user as unknown as SessionUser).adminRole;
      }

      // On every token refresh: if role is ADMIN but adminRole is missing
      // (can happen for Google OAuth admins), hydrate from DB
      if (token.role === "ADMIN" && !token.adminRole) {
        try {
          const admin = await prisma.admin.findUnique({
            where: { userId: token.id as string },
            select: { role: true, isActive: true },
          });
          if (admin?.isActive) {
            token.adminRole = admin.role;
          }
        } catch {
          // silently ignore — token will be missing adminRole but RBAC will handle it
        }
      }

      // On "update" trigger (e.g. session.update() call), re-fetch role from DB
      // so role changes are reflected without forcing a re-login
      if (trigger === "update" && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: { admin: { select: { role: true, isActive: true } } },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.adminRole = dbUser.admin?.isActive ? dbUser.admin.role : undefined;
          }
        } catch {
          // silently ignore
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as SessionUser["role"];
        session.user.adminRole = token.adminRole as SessionUser["adminRole"];
      }
      return session;
    },
  },
});
