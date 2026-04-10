import { NextRequest, NextResponse } from "next/server";
import { topicInputSchema } from "@/lib/validators";
import { ensureDatabaseSeeded, getPrisma, jsonError, requireRole } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

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

  const parsed = topicInputSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Nie udało się zaktualizować tematu.", 400);
  }

  const { id } = await context.params;
  const prisma = getPrisma();

  try {
    const topic = await prisma.topic.update({
      where: { id },
      data: {
        chapterId: parsed.data.chapterId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        order: parsed.data.order,
      },
    });

    return NextResponse.json({ topic });
  } catch {
    return jsonError("Temat nie istnieje.", 404);
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

  try {
    await prisma.topic.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Temat nie istnieje.", 404);
  }
}