import { NextRequest, NextResponse } from "next/server";
import { chapterInputSchema } from "@/lib/validators";
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

  const parsed = chapterInputSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Nie udało się zaktualizować rozdziału.", 400);
  }

  const { id } = await context.params;
  const prisma = getPrisma();

  try {
    const chapter = await prisma.chapter.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        order: parsed.data.order,
      },
    });

    return NextResponse.json({ chapter });
  } catch {
    return jsonError("Rozdział nie istnieje.", 404);
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
    await prisma.chapter.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Rozdział nie istnieje.", 404);
  }
}