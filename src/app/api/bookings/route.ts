import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookingStatus, Role, Season } from "@prisma/client";
import { getSeason, cleaningDateFor } from "@/lib/utils";
import { notifyFamily, notifyAllExcept } from "@/lib/notifications";
import { getFamilyNames } from "@/lib/familyNames";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const bookings = await db.booking.findMany({
    include: { cleaning: true, approvals: { include: { approvedBy: true } }, createdBy: true },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  try {
    const body = await req.json();
    const { family, startDate, endDate, note, season: seasonParam, withCleaning } = body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const season = seasonParam || getSeason(start);

    // Admin-Zuweisung (Wintersaison)
    if (session.user.role === Role.ADMIN) {
      const booking = await db.booking.create({
        data: {
          family,
          startDate: start,
          endDate: end,
          season,
          status: BookingStatus.ASSIGNED,
          note: note || null,
          createdById: session.user.id,
        },
      });

      // Reinigung automatisch anlegen
      const cleaningDate = cleaningDateFor(end);
      try {
        await db.cleaning.create({ data: { date: cleaningDate, bookingId: booking.id } });
      } catch (err) {
        console.error("Fehler beim Erstellen der Reinigung:", err);
        // Buchung bleibt erhalten; Reinigung kann manuell nachgetragen werden
      }

      // Notification (nicht-kritisch)
      try {
        await notifyFamily({
          role: family as Role,
          type: "BOOKING_ASSIGNED",
          title: "Neue Woche zugeteilt",
          body: `Euch wurde ein Aufenthalt vom ${start.toLocaleDateString("de-DE")} bis ${end.toLocaleDateString("de-DE")} zugeteilt.`,
          linkHref: "/buchungen",
        });
      } catch (err) {
        console.error("Fehler beim Senden der Benachrichtigung:", err);
      }

      return NextResponse.json({ ...booking, cleaningDate: cleaningDate.toISOString() });
    }

    // Sommeranfrage (FAMILY_1 oder FAMILY_2)
    if (season === Season.SUMMER) {
      const booking = await db.booking.create({
        data: {
          family: session.user.role,
          startDate: start,
          endDate: end,
          season: Season.SUMMER,
          status: BookingStatus.REQUESTED,
          note: note || null,
          withCleaning: withCleaning !== false, // default true
          createdById: session.user.id,
        },
      });

      // Andere Familie und Admin benachrichtigen (nicht-kritisch)
      try {
        const familyNames = await getFamilyNames();
        const senderName = familyNames[session.user.role as Role] ?? session.user.role;
        await notifyAllExcept({
          excludeRole: session.user.role,
          type: "REQUEST_PENDING",
          title: "Neue Buchungsanfrage",
          body: `${senderName} hat eine Anfrage für ${start.toLocaleDateString("de-DE")} bis ${end.toLocaleDateString("de-DE")} gestellt.`,
          linkHref: "/anfragen",
        });
      } catch (err) {
        console.error("Fehler beim Senden der Benachrichtigung:", err);
      }

      return NextResponse.json(booking);
    }

    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  } catch (err) {
    console.error("Fehler beim Erstellen der Buchung:", err);
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
