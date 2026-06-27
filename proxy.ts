import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { authRateLimit, apiRateLimit } from "@/lib/rate-limit";

// Routes that require authentication
const PROTECTED_CUSTOMER_ROUTES = ["/dashboard", "/bookings", "/profile", "/certificates"];
const PROTECTED_ADMIN_ROUTES = ["/admin"];

// Routes with strict rate limiting
const AUTH_ROUTES = ["/api/auth/", "/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";

  // =========================================================================
  // Domain Redirect: vrindavanbhandara.in → vrindavanbhandara.com (301)
  // =========================================================================
  const IN_DOMAINS = ["vrindavanbhandara.in", "www.vrindavanbhandara.in"];
  if (IN_DOMAINS.includes(host)) {
    const redirectUrl = `https://vrindavanbhandara.com${pathname}${search}`;
    return NextResponse.redirect(redirectUrl, { status: 301 });
  }


  // =========================================================================
  // Rate limiting for auth routes
  // =========================================================================
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    const rl = await authRateLimit(ip);
    if (!rl.success) {
      return new NextResponse(
        JSON.stringify({ error: "Too many attempts. Please try again in 15 minutes." }),
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

  // =========================================================================
  // Auth check for protected customer routes
  // =========================================================================
  const isProtectedCustomer = PROTECTED_CUSTOMER_ROUTES.some((r) => pathname.startsWith(r));
  const isProtectedAdmin = PROTECTED_ADMIN_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtectedCustomer || isProtectedAdmin) {
    const session = await auth();

    if (!session?.user?.id) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin route protection
    if (isProtectedAdmin && session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // =========================================================================
  // Security headers are set in next.config.ts
  // =========================================================================

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-|apple-icon|og-image).*)",
  ],
};
