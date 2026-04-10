import { NextRequest, NextResponse } from "next/server";
import { testInputSchema } from "@/lib/validators";
import { ensureDatabaseSeeded, getPrisma, jsonError, requireSession, requireRole } from "@/lib/api";

export async function GET(request: NextRequest) {
  await ensureDatabaseSeeded();

  const session = await requireSession(request);

  if (!session) {
    return jsonError("Nieautoryzowany dostęp.", 401);
  }

  const prisma = getPrisma();
  const tests = await prisma.test.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      topic: {
        select: {
          id: true,
          title: true,
          chapter: { select: { id: true, title: true } },
        },
      },
    },
  });

  return NextResponse.json({ tests });
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

  const parsed = testInputSchema.safeParse(body);

  if (!parsed.success) {
    const fields = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean)
      .join(", ");

    return jsonError(`Nie udało się zapisać testu. Sprawdź pola: ${fields || "formularz"}.`, 400);
  }

  const prisma = getPrisma();

  try {
    const test = await prisma.test.create({
      data: {
        topic: {
          connect: { id: parsed.data.topicId },
        },
        title: parsed.data.title,
        questionCount: parsed.data.questionCount,
        answerMode: parsed.data.answerMode,
        status: parsed.data.status,
        content: parsed.data.content,
        order: parsed.data.order,
        published: parsed.data.published,
      },
    });

    return NextResponse.json({ test }, { status: 201 });
  } catch {
    return jsonError("Nie udało się utworzyć testu.", 400);
  }
}