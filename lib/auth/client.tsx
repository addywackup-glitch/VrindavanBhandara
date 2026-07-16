// =============================================================================
// Client auth helpers — replaces next-auth/react SessionProvider / useSession.
// =============================================================================

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { SessionUser } from "@/types";

export type ClientSession = {
  user: SessionUser & {
    email: string;
    name: string;
    image?: string | null;
  };
} | null;

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  data: ClientSession;
  status: SessionStatus;
  update: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  data: null,
  status: "loading",
  update: async () => {},
});

async function fetchSession(): Promise<ClientSession> {
  try {
    const res = await fetch("/api/auth/session", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      user?: NonNullable<ClientSession>["user"] | null;
    };
    if (!json.user) return null;
    return { user: json.user };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ClientSession>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  const refresh = useCallback(async () => {
    const session = await fetchSession();
    setData(session);
    setStatus(session ? "authenticated" : "unauthenticated");
  }, []);

  useEffect(() => {
    let cancelled = false;

    const boot = () => {
      if (!cancelled) void refresh();
    };
    // Defer so we don't sync-setState inside the effect body (lint rule).
    const t = setTimeout(boot, 0);

    try {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(() => {
        if (!cancelled) void refresh();
      });
      return () => {
        cancelled = true;
        clearTimeout(t);
        subscription.unsubscribe();
      };
    } catch {
      setTimeout(() => {
        if (!cancelled) setStatus("unauthenticated");
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }
  }, [refresh]);

  const value = useMemo(
    () => ({ data, status, update: refresh }),
    [data, status, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Compatibility shim matching next-auth `useSession()`. */
export function useSession() {
  const ctx = useContext(AuthContext);
  return { data: ctx.data, status: ctx.status, update: ctx.update };
}

export async function signIn(
  provider: "credentials" | "google",
  options?: {
    email?: string;
    password?: string;
    redirect?: boolean;
    callbackUrl?: string;
  }
): Promise<{ error?: string; ok?: boolean; url?: string }> {
  const callbackUrl = options?.callbackUrl ?? "/dashboard";

  if (provider === "google") {
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
      },
    });
    if (error) return { error: error.message, ok: false };
    return { ok: true };
  }

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      email: options?.email,
      password: options?.password,
    }),
  });

  const json = (await res.json()) as {
    success?: boolean;
    error?: string;
    data?: { role?: string };
  };

  if (!res.ok || !json.success) {
    return { error: json.error ?? "Invalid email or password", ok: false };
  }

  if (options?.redirect !== false && typeof window !== "undefined") {
    const dest =
      json.data?.role === "ADMIN"
        ? callbackUrl.startsWith("/admin")
          ? callbackUrl
          : "/admin"
        : callbackUrl;
    window.location.href = dest;
  }

  return { ok: true, url: callbackUrl };
}

export async function signOut(options?: {
  callbackUrl?: string;
}): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  if (typeof window !== "undefined") {
    window.location.href = options?.callbackUrl ?? "/";
  }
}
