import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyAllExcept } from "@/lib/notifications";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const cleanings = await db.cleaning.findMany({
    include: { booking: true },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(cleanings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { date, note } = await req.json();
  const cleaningDate = new Date(date);

  const cleaning = await db.cleaning.create({
    data: { date: cleaningDate, note: note || null },
    include: { booking: true },
  });

  try {
    await notifyAllExcept({
      excludeRole: session.user.role,
      type: "CLEANING_SCHEDULED",
      title: "Reinigung geplant",
      body: `Eine Reinigung wurde für den ${cleaningDate.toLocaleDateString("de-DE")} bestellt.`,
      linkHref: "/reinigung",
    });
  } catch (err) {
    console.error("Fehler beim Senden der Benachrichtigung:", err);
  }

  return NextResponse.json(cleaning);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Keine ID angegeben" }, { status: 400 });

  await db.cleaning.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
