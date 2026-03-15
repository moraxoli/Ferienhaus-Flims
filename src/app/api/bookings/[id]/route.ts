import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookingStatus, Role } from "@prisma/client";
import { notifyAllExcept, notifyFamily } from "@/lib/notifications";
import { getFamilyNames } from "@/lib/familyNames";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Buchung nicht gefunden" }, { status: 404 });

  // Woche freigeben
  if (action === "release") {
    if (booking.family !== session.user.role && session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }
    await db.booking.update({ where: { id }, data: { status: BookingStatus.RELEASED } });

    const familyNames = await getFamilyNames();
    const releaserName = familyNames[booking.family] ?? booking.family;
    await notifyAllExcept({
      excludeRole: booking.family,
      type: "WEEK_RELEASED",
      title: "Woche freigegeben",
      body: `${releaserName} hat den Zeitraum ${booking.startDate.toLocaleDateString("de-DE")} – ${booking.endDate.toLocaleDateString("de-DE")} freigegeben.`,
      linkHref: "/kalender",
    });

    return NextResponse.json({ ok: true });
  }

  // Admin: Status auf Abgelehnt setzen
  if (action === "reject" && session.user.role === Role.ADMIN) {
    await db.booking.update({ where: { id }, data: { status: BookingStatus.REJECTED } });
    try {
      await notifyFamily({
        role: booking.family,
        type: "REQUEST_REJECTED",
        title: "Anfrage abgelehnt",
        body: `Euer Aufenthalt vom ${booking.startDate.toLocaleDateString("de-DE")} bis ${booking.endDate.toLocaleDateString("de-DE")} wurde vom Administrator abgelehnt.`,
        linkHref: "/anfragen",
      });
    } catch (err) {
      console.error("Fehler bei Notification:", err);
    }
    return NextResponse.json({ ok: true });
  }

  // Admin: Buchung löschen
  if (action === "delete" && session.user.role === Role.ADMIN) {
    await db.booking.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;
  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ error: "Buchung nicht gefunden" }, { status: 404 });

  // Admin kann alles löschen; Familie nur eigene Buchungen
  const canDelete =
    session.user.role === Role.ADMIN || booking.family === session.user.role;
  if (!canDelete) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  await db.cleaning.deleteMany({ where: { bookingId: id } });
  await db.approval.deleteMany({ where: { bookingId: id } });
  await db.booking.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
