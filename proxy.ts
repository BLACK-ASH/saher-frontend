import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const access = request.cookies.get("saher_access_token")?.value;
  const refresh = request.cookies.get("saher_refresh_token")?.value;

  const { pathname } = request.nextUrl;

  const isLoginPage = pathname.startsWith("/login");

  // ❌ Not logged in at all
  if (!access && !refresh && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ✅ Already logged in → prevent going back to login
  if ((access || refresh) && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)",
  ],
};
