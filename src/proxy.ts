import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName, verifySessionToken } from "@/lib/session";

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(sessionCookieName)?.value;

  if (!token) {
    if (pathname.startsWith("/teacher") || pathname.startsWith("/student")) {
      return redirectTo(request, "/login");
    }

    return NextResponse.next();
  }

  const session = await verifySessionToken(token);

  if (!session) {
    const response = redirectTo(request, "/login");
    response.cookies.delete(sessionCookieName);
    return response;
  }

  if (pathname.startsWith("/teacher") && session.role !== "teacher") {
    return redirectTo(request, "/student");
  }

  if (pathname.startsWith("/student") && session.role !== "student") {
    return redirectTo(request, "/teacher");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};