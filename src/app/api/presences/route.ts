import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookingStatus, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { bookingId, memberName, startDate, endDate } = await req.json();

  if (!memberName?.trim() || !startDate || !endDate) {
    return NextResponse.json({ error: "Name und Zeitraum sind erforderlich." }, { status: 400 });
  }

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return NextResponse.json({ error: "Buchung nicht gefunden" }, { status: 404 });

  const isAdmin = session.user.role === Role.ADMIN;
  if (!isAdmin && booking.family !== session.user.role) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  if (booking.status !== BookingStatus.APPROVED && booking.status !== BookingStatus.ASSIGNED && booking.status !== BookingStatus.RELEASED) {
    return NextResponse.json({ error: "Anwesenheiten können nur für bestätigte Buchungen eingetragen werden." }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return NextResponse.json({ error: "Das Enddatum muss nach dem Startdatum liegen." }, { status: 400 });
  }
  if (start < booking.startDate || end > booking.endDate) {
    return NextResponse.json({ error: "Die Anwesenheit muss innerhalb des gebuchten Zeitraums liegen." }, { status: 400 });
  }

  const presence = await db.presence.create({
    data: {
      bookingId,
      memberName: memberName.trim(),
      startDate: start,
      endDate: end,
    },
  });

  return NextResponse.json(presence);
}
