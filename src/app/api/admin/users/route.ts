import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 });
  }

  const { role, name } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name darf nicht leer sein." }, { status: 400 });
  }
  if (role !== Role.FAMILY_1 && role !== Role.FAMILY_2) {
    return NextResponse.json({ error: "Ungültige Rolle." }, { status: 400 });
  }

  await db.user.updateMany({ where: { role }, data: { name: name.trim() } });
  return NextResponse.json({ ok: true });
}
