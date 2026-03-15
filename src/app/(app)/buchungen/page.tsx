import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { formatDateRange, statusColor, statusLabel } from "@/lib/utils";
import { getFamilyNames } from "@/lib/familyNames";

export default async function BuchungenPage() {
  const session = await auth();
  const isAdmin = session?.user.role === Role.ADMIN;
  const familyNames = await getFamilyNames();

  const where = isAdmin
    ? {}
    : { family: session!.user.role, status: { not: "REJECTED" as const } };
  const bookings = await db.booking.findMany({
    where,
    include: { cleaning: true },
    orderBy: { startDate: "asc" },
  });

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isAdmin ? "Alle Buchungen" : "Meine Buchungen"}
      </h1>

      {bookings.length === 0 && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          Noch keine Buchungen vorhanden.
        </div>
      )}

      <div className="space-y-3">
        {bookings.map((booking) => (
          <div key={booking.id} className="bg-white rounded-xl shadow p-5 flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-semibold text-gray-900">
                  {formatDateRange(booking.startDate, booking.endDate)}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(booking.status)}`}>
                  {statusLabel(booking.status)}
                </span>
                <span className="text-xs text-gray-400">
                  {booking.season === "WINTER" ? "Winter" : "Sommer"}
                </span>
              </div>
              {isAdmin && (
                <p className="text-sm text-gray-500 mb-1">{familyNames[booking.family]}</p>
              )}
              {booking.note && (
                <p className="text-sm text-gray-600">{booking.note}</p>
              )}
              {booking.cleaning && (
                <p className="text-sm text-gray-400 mt-1">
                  🧹 Reinigung: {new Date(booking.cleaning.date).toLocaleDateString("de-DE")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
