import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/bootstrap";
import { sessionCookieName, verifySessionToken } from "@/lib/session";
import type { Role } from "@/lib/school-data";

export async function getSessionFromRequest(request: Request) {
  const token = getCookieValue(request.headers.get("cookie"), sessionCookieName);

  if (!token) {
    return null;
  }

  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  return session;
}

export async function requireSession(request: Request) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return null;
  }

  return session;
}

export async function requireRole(request: Request, role: Role) {
  const session = await requireSession(request);

  if (!session || session.role !== role) {
    return null;
  }

  return session;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function ensureDatabaseSeeded() {
  await ensureSeeded();
}

export async function withSeeder<T>(handler: () => Promise<T>) {
  await ensureDatabaseSeeded();
  return handler();
}

export function safeParseNumber(value: FormDataEntryValue | null, fallback = 0) {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function safeParseBoolean(value: FormDataEntryValue | null, fallback = false) {
  if (typeof value !== "string") {
    return fallback;
  }

  return value === "true" || value === "1" || value === "on";
}

export function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader.split("; ").find((item) => item.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(name.length + 1));
}

export function formatHierarchy(chapters: Array<{ id: string; title: string; description: string | null; order: number; topics: Array<{ id: string; title: string; description: string | null; order: number; materials: Array<{ id: string }> ; tests: Array<{ id: string }> }> }>) {
  return chapters.map((chapter) => ({
    ...chapter,
    topics: chapter.topics.map((topic) => ({
      ...topic,
      materialCount: topic.materials.length,
      testCount: topic.tests.length,
    })),
  }));
}

export function getPrisma() {
  return prisma;
}