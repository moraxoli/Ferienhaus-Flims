import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;
  const presence = await db.presence.findUnique({
    where: { id },
    include: { booking: true },
  });

  if (!presence) return NextResponse.json({ error: "Anwesenheit nicht gefunden" }, { status: 404 });

  const isAdmin = session.user.role === Role.ADMIN;
  if (!isAdmin && presence.booking.family !== session.user.role) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  await db.presence.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
