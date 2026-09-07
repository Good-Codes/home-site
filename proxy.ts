import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { authConfig } from "@/auth.config";
import { isStaffRole } from "@/lib/auth/roles";
import { safeCallbackPath } from "@/lib/auth/callback-url";

const { auth } = NextAuth(authConfig);

function isAuthExempt(path: string): boolean {
  if (path.startsWith("/api/auth")) return true;
  if (path.startsWith("/admin/login")) return true;
  if (path.startsWith("/api/project-blueprint/uploads/scan-callback")) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (isAuthExempt(path)) {
    return NextResponse.next();
  }

  const session = await auth();
  const role = session?.user?.role;

  if ((path === "/login" || path === "/signup") && session?.user) {
    const dest = isStaffRole(role)
      ? "/admin/project-blueprint"
      : "/custom-software-estimator";
    const next = request.nextUrl.searchParams.get("next");
    return NextResponse.redirect(new URL(safeCallbackPath(next, dest), request.url));
  }

  if (path === "/login" || path === "/signup") {
    return NextResponse.next();
  }

  if (path.startsWith("/custom-software-estimator")) {
    if (!session?.user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", path);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (path.startsWith("/account")) {
    if (!session?.user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", path);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (path.startsWith("/admin")) {
    if (!session?.user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", path);
      return NextResponse.redirect(loginUrl);
    }
    if (!isStaffRole(role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/custom-software-estimator/:path*",
    "/account",
    "/login",
    "/signup",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
