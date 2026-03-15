import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const { to, subject, html } = await req.json();
  if (!to) return NextResponse.json({ error: "Keine Empfänger-E-Mail" }, { status: 400 });

  await sendEmail({ to, subject, html });
  return NextResponse.json({ ok: true });
}
