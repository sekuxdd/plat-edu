import { NextRequest, NextResponse } from "next/server";
import { materialInputSchema } from "@/lib/validators";
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

  const parsed = materialInputSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Nie udało się zaktualizować materiału.", 400);
  }

  const { id } = await context.params;
  const prisma = getPrisma();

  try {
    const material = await prisma.material.update({
      where: { id },
      data: {
        topicId: parsed.data.topicId,
        title: parsed.data.title,
        type: parsed.data.type,
        content: parsed.data.content,
        order: parsed.data.order,
        published: parsed.data.published,
      },
    });

    return NextResponse.json({ material });
  } catch {
    return jsonError("Materiał nie istnieje.", 404);
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
    await prisma.material.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Materiał nie istnieje.", 404);
  }
}