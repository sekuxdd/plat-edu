import { NextRequest, NextResponse } from "next/server";
import { topicInputSchema } from "@/lib/validators";
import { ensureDatabaseSeeded, getPrisma, jsonError, requireSession, requireRole } from "@/lib/api";

export async function GET(request: NextRequest) {
  await ensureDatabaseSeeded();

  const session = await requireSession(request);

  if (!session) {
    return jsonError("Nieautoryzowany dostęp.", 401);
  }

  const prisma = getPrisma();
  const topics = await prisma.topic.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      chapter: { select: { id: true, title: true } },
      materials: { select: { id: true } },
      tests: { select: { id: true } },
    },
  });

  return NextResponse.json({ topics });
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

  const parsed = topicInputSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Nie udało się zapisać tematu.", 400);
  }

  const prisma = getPrisma();

  try {
    const topic = await prisma.topic.create({
      data: {
        chapterId: parsed.data.chapterId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        order: parsed.data.order,
      },
    });

    return NextResponse.json({ topic }, { status: 201 });
  } catch {
    return jsonError("Nie udało się utworzyć tematu.", 400);
  }
}