import { NextRequest, NextResponse } from "next/server";
import { ensureDatabaseSeeded, getPrisma, requireSession, jsonError } from "@/lib/api";

export async function GET(request: NextRequest) {
  await ensureDatabaseSeeded();

  const session = await requireSession(request);

  if (!session) {
    return jsonError("Nieautoryzowany dostęp.", 401);
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  if (!user) {
    return jsonError("Sesja wygasła.", 401);
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}