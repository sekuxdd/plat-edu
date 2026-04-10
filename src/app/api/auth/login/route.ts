import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureDatabaseSeeded, jsonError, getPrisma } from "@/lib/api";
import { createSessionToken, sessionCookieName } from "@/lib/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(["student", "teacher"]),
});

export async function POST(request: NextRequest) {
  await ensureDatabaseSeeded();

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Nieprawidłowe dane żądania.", 400);
  }

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Uzupełnij poprawnie dane logowania.", 400);
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (!user) {
    return jsonError("Nieprawidłowy e-mail lub hasło.", 401);
  }

  const passwordValid = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!passwordValid) {
    return jsonError("Nieprawidłowy e-mail lub hasło.", 401);
  }

  if (user.role !== parsed.data.role) {
    return jsonError("To konto ma inną rolę niż wybrana na ekranie logowania.", 403);
  }

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });

  const isHttpsRequest =
    request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";

  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttpsRequest,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}