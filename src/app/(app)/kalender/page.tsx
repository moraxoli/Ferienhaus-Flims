import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFamilyNames } from "@/lib/familyNames";
import KalenderClient from "./KalenderClient";

export default async function KalenderPage() {
  const session = await auth();
  const [bookings, cleanings, familyNames] = await Promise.all([
    db.booking.findMany({
      where: { status: { not: "REJECTED" } },
      include: { cleaning: true, presences: true },
      orderBy: { startDate: "asc" },
    }),
    db.cleaning.findMany({ orderBy: { date: "asc" } }),
    getFamilyNames(),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Kalender</h1>
      <KalenderClient bookings={bookings} cleanings={cleanings} session={session!} familyNames={familyNames} />
    </div>
  );
}
