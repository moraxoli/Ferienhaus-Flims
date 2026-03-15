import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { email, currentPassword, newPassword } = await req.json();

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });

  const updates: { email?: string; password?: string } = {};

  if (email?.trim() && email.trim() !== user.email) {
    const existing = await db.user.findUnique({ where: { email: email.trim() } });
    if (existing) return NextResponse.json({ error: "Diese E-Mail-Adresse wird bereits verwendet." }, { status: 400 });
    updates.email = email.trim();
  }

  if (newPassword) {
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "Aktuelles Passwort ist falsch." }, { status: 400 });
    updates.password = await bcrypt.hash(newPassword, 12);
    (updates as Record<string, unknown>).plainPassword = newPassword;
  }

  await db.user.update({ where: { id: session.user.id }, data: updates });
  return NextResponse.json({ ok: true });
}
