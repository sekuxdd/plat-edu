import { NextRequest, NextResponse } from "next/server";
import { chapterInputSchema } from "@/lib/validators";
import { ensureDatabaseSeeded, getPrisma, jsonError, requireSession, requireRole } from "@/lib/api";

export async function GET(request: NextRequest) {
  await ensureDatabaseSeeded();

  const session = await requireSession(request);

  if (!session) {
    return jsonError("Nieautoryzowany dostęp.", 401);
  }

  const prisma = getPrisma();
  const chapters = await prisma.chapter.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      topics: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: {
          materials: { select: { id: true } },
          tests: { select: { id: true } },
        },
      },
    },
  });

  return NextResponse.json({ chapters });
}

export async function POST(request: NextRequest) {
  await ensureDatabaseSeeded();

  const session = await requireRole(request, "teacher");

  if (!session) {
    return jsonError("Brak uprawnień.", 403);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Nieprawidłowe dane żądania.", 400);
  }

  const parsed = chapterInputSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Nie udało się zapisać rozdziału.", 400);
  }

  const prisma = getPrisma();
  const chapter = await prisma.chapter.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      order: parsed.data.order,
    },
  });

  return NextResponse.json({ chapter }, { status: 201 });
}