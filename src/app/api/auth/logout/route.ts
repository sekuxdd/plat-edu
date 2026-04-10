import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/session";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });

  const isHttpsRequest =
    request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";

  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttpsRequest,
    path: "/",
    maxAge: 0,
  });

  return response;
}