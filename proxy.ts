import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const access = request.cookies.get("saher_access_token")?.value;
  const refresh = request.cookies.get("saher_refresh_token")?.value;

  const { pathname } = request.nextUrl;

  // 🔓 Public routes
  const publicRoutes = ["/login", "/forgot-password"];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // ❌ Not logged in → block private routes
  if (!access && !refresh && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ✅ Logged in → block auth pages
  if ((access || refresh) && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)",
  ],
};
