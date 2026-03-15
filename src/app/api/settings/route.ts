import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }
  const settings = await db.setting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return NextResponse.json(map);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }
  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    await db.setting.upsert({
      where: { key },
      update: { value: value as string },
      create: { key, value: value as string },
    });
  }
  return NextResponse.json({ ok: true });
}
