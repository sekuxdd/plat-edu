import { jwtVerify, SignJWT } from "jose";
import type { Role } from "@/lib/school-data";

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: Role;
};

export const sessionCookieName = "eduplatforma-session";
const sessionSecret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "eduplatforma-dev-secret-change-me",
);

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(sessionSecret);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, sessionSecret);

    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}