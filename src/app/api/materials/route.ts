import { NextRequest, NextResponse } from "next/server";
import { materialInputSchema } from "@/lib/validators";
import { ensureDatabaseSeeded, getPrisma, jsonError, requireSession, requireRole } from "@/lib/api";

export async function GET(request: NextRequest) {
  await ensureDatabaseSeeded();

  const session = await requireSession(request);

  if (!session) {
    return jsonError("Nieautoryzowany dostęp.", 401);
  }

  const prisma = getPrisma();
  const materials = await prisma.material.findMany({
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

  return NextResponse.json({ materials });
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

  const parsed = materialInputSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Nie udało się zapisać materiału.", 400);
  }

  const prisma = getPrisma();

  try {
    const material = await prisma.material.create({
      data: {
        topicId: parsed.data.topicId,
        title: parsed.data.title,
        type: parsed.data.type,
        content: parsed.data.content,
        order: parsed.data.order,
        published: parsed.data.published,
      },
    });

    return NextResponse.json({ material }, { status: 201 });
  } catch {
    return jsonError("Nie udało się utworzyć materiału.", 400);
  }
}