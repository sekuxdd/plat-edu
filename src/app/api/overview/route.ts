import { NextRequest, NextResponse } from "next/server";
import { ensureDatabaseSeeded, formatHierarchy, getPrisma, requireSession, jsonError } from "@/lib/api";

export async function GET(request: NextRequest) {
  await ensureDatabaseSeeded();

  const session = await requireSession(request);

  if (!session) {
    return jsonError("Nieautoryzowany dostęp.", 401);
  }

  const prisma = getPrisma();
  const [chapters, materials, tests] = await Promise.all([
    prisma.chapter.findMany({
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
    }),
    prisma.material.findMany({
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
    }),
    prisma.test.findMany({
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
    }),
  ]);

  return NextResponse.json({
    chapters: formatHierarchy(chapters),
    materials,
    tests,
  });
}