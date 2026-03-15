import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookingStatus, Decision, Role } from "@prisma/client";
import { cleaningDateFor } from "@/lib/utils";
import { notifyFamily } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { bookingId, decision, comment } = await req.json();

  const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { createdBy: true } });
  if (!booking) return NextResponse.json({ error: "Buchung nicht gefunden" }, { status: 404 });

  // Nur die andere Familie oder Admin darf genehmigen
  if (booking.family === session.user.role && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Eigene Anfrage kann nicht genehmigt werden" }, { status: 403 });
  }

  const newStatus = decision === "APPROVED" ? BookingStatus.APPROVED : BookingStatus.REJECTED;

  const approval = await db.$transaction(async (tx) => {
    const created = await tx.approval.create({
      data: {
        bookingId,
        approvedById: session.user.id,
        decision: decision as Decision,
        comment: comment || null,
      },
    });
    await tx.booking.update({ where: { id: bookingId }, data: { status: newStatus } });
    return created;
  });

  // Reinigung und Notifications (nicht-kritisch)
  try {
    if (decision === "APPROVED") {
      if (booking.withCleaning) {
        const cleaningDate = cleaningDateFor(booking.endDate);
        await db.cleaning.create({ data: { date: cleaningDate, bookingId: booking.id } });
      }
      await notifyFamily({
        role: booking.family,
        type: "REQUEST_APPROVED",
        title: "Anfrage genehmigt",
        body: `Euer Aufenthalt vom ${booking.startDate.toLocaleDateString("de-DE")} bis ${booking.endDate.toLocaleDateString("de-DE")} wurde genehmigt.`,
        linkHref: "/buchungen",
      });
    } else {
      await notifyFamily({
        role: booking.family,
        type: "REQUEST_REJECTED",
        title: "Anfrage abgelehnt",
        body: `Euer Aufenthalt vom ${booking.startDate.toLocaleDateString("de-DE")} bis ${booking.endDate.toLocaleDateString("de-DE")} wurde leider abgelehnt.${comment ? ` Kommentar: ${comment}` : ""}`,
        linkHref: "/anfragen",
      });
    }
  } catch (err) {
    console.error("Fehler bei Reinigung/Notification:", err);
  }

  return NextResponse.json({ ok: true, decision: newStatus });
}
