import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { authRateLimit } from "@/lib/rate-limit";
import { hasSupabaseConfig } from "@/lib/supabase/env";

const PROTECTED_CUSTOMER_ROUTES = ["/dashboard", "/bookings"];
const PROTECTED_ADMIN_ROUTES = ["/admin"];
const AUTH_ROUTES = ["/api/auth/", "/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const IN_DOMAINS = ["vrindavanbhandara.in", "www.vrindavanbhandara.in"];
  if (IN_DOMAINS.includes(host)) {
    const redirectUrl = `https://vrindavanbhandara.com${pathname}${search}`;
    return NextResponse.redirect(redirectUrl, { status: 301 });
  }

  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    const rl = await authRateLimit(ip);
    if (!rl.success) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many attempts. Please try again in 15 minutes.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": rl.resetAt.toISOString(),
          },
        }
      );
    }
  }

  // Refresh Supabase session cookies (required for SSR auth).
  // Do NOT use Prisma here — proxy runs on the Edge runtime.
  let response = NextResponse.next({ request });
  let isAuthenticated = false;
  let isAdminClaim = false;

  if (hasSupabaseConfig()) {
    try {
      const sessionResult = await updateSession(request);
      response = sessionResult.response;
      isAuthenticated = Boolean(sessionResult.user);
      // Role claim synced into app_metadata by auth sync (optional).
      const meta = sessionResult.user?.app_metadata as
        | { role?: string }
        | undefined;
      isAdminClaim = meta?.role === "ADMIN";
    } catch (error) {
      console.error("[proxy] supabase session refresh failed", error);
    }
  }

  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    return NextResponse.redirect(new URL("/dashboard/profile", request.url));
  }

  const isProtectedCustomer = PROTECTED_CUSTOMER_ROUTES.some((r) =>
    pathname.startsWith(r)
  );
  const isProtectedAdmin = PROTECTED_ADMIN_ROUTES.some((r) =>
    pathname.startsWith(r)
  );

  if (pathname === "/login" || pathname === "/register") {
    if (isAuthenticated) {
      const dest = isAdminClaim ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  if (isProtectedCustomer || isProtectedAdmin) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Fine-grained ADMIN check remains in app/admin/layout.tsx (Prisma RBAC).
    // Edge only enforces "must be logged in" for /admin.
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-|apple-icon|og-image).*)",
  ],
};
