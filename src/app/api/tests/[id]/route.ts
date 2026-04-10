import { NextRequest, NextResponse } from "next/server";
import { testInputSchema } from "@/lib/validators";
import { ensureDatabaseSeeded, getPrisma, jsonError, requireRole, requireSession } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Params) {
  await ensureDatabaseSeeded();

  const session = await requireSession(request);

  if (!session) {
    return jsonError("Nieautoryzowany dostęp.", 401);
  }

  const { id } = await context.params;
  const prisma = getPrisma();

  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      topic: {
        select: {
          id: true,
          title: true,
          chapter: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!test) {
    return jsonError("Test nie istnieje.", 404);
  }

  if (session.role === "student" && !test.published) {
    return jsonError("Test niedostępny.", 404);
  }

  return NextResponse.json({ test });
}

export async function PUT(request: NextRequest, context: Params) {
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

    return jsonError(`Nie udało się zaktualizować testu. Sprawdź pola: ${fields || "formularz"}.`, 400);
  }

  const { id } = await context.params;
  const prisma = getPrisma();

  const existingTest = await prisma.test.findUnique({ where: { id } });

  if (!existingTest) {
    return jsonError("Test nie istnieje.", 404);
  }

  try {
    const test = await prisma.test.update({
      where: { id },
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

    return NextResponse.json({ test });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nie udało się zaktualizować testu.";
    return jsonError(message, 500);
  }
}

export async function DELETE(request: NextRequest, context: Params) {
  await ensureDatabaseSeeded();

  const session = await requireRole(request, "teacher");

  if (!session) {
    return jsonError("Brak uprawnień.", 403);
  }

  const { id } = await context.params;
  const prisma = getPrisma();

  const existingTest = await prisma.test.findUnique({ where: { id } });

  if (!existingTest) {
    return jsonError("Test nie istnieje.", 404);
  }

  try {
    await prisma.test.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nie udało się usunąć testu.";
    return jsonError(message, 500);
  }
}