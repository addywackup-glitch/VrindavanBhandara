"use client";

// =============================================================================
// Client Providers — wraps the app with all necessary context providers
// SessionProvider makes useSession() available to all client components
// =============================================================================

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Refetch session every 5 minutes to handle expiry gracefully
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}
