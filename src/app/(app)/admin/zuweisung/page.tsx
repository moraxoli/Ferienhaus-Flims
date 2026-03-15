import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role, BookingStatus } from "@prisma/client";
import { getFamilyNames } from "@/lib/familyNames";
import { db } from "@/lib/db";
import { formatDateRange, statusLabel, statusColor } from "@/lib/utils";
import ZuweisungForm from "./ZuweisungForm";
import ZuweisungKalender from "./ZuweisungKalender";
import DeleteBookingButton from "../uebersicht/DeleteBookingButton";

function countDays(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function ZuweisungPage() {
  const session = await auth();
  if (session?.user.role !== Role.ADMIN) redirect("/kalender");

  const [familyNames, allBookings] = await Promise.all([
    getFamilyNames(),
    db.booking.findMany({
      where: {
        status: {
          in: [BookingStatus.ASSIGNED, BookingStatus.APPROVED, BookingStatus.REQUESTED],
        },
      },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const activeBookings = allBookings.filter(
    (b) => b.status === BookingStatus.ASSIGNED || b.status === BookingStatus.APPROVED
  );

  const days1 = activeBookings
    .filter((b) => b.family === Role.FAMILY_1)
    .reduce((sum, b) => sum + countDays(b.startDate, b.endDate), 0);

  const days2 = activeBookings
    .filter((b) => b.family === Role.FAMILY_2)
    .reduce((sum, b) => sum + countDays(b.startDate, b.endDate), 0);

  const total = days1 + days2;
  const diff = days1 - days2;
  const pct1 = total > 0 ? Math.round((days1 / total) * 100) : 50;
  const pct2 = total > 0 ? Math.round((days2 / total) * 100) : 50;

  const name1 = familyNames[Role.FAMILY_1];
  const name2 = familyNames[Role.FAMILY_2];

  const bookingEntries = activeBookings.map((b) => ({
    family: b.family as "FAMILY_1" | "FAMILY_2",
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
  }));

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Tage zuweisen</h1>
        <p className="text-gray-500 text-sm">
          Wintersaison (Dezember – April): Weise einer Familie einen Aufenthalt zu. Die Reinigung
          wird automatisch für den nächsten Montag nach Aufenthaltsende geplant.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left column: Übersicht + Formular */}
        <div className="space-y-6">
          {/* Tage-Übersicht */}
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Gebuchte Tage – Übersicht
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center bg-blue-50 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-600 mb-1">{name1}</p>
                <p className="text-3xl font-bold text-blue-700">{days1}</p>
                <p className="text-xs text-blue-500 mt-1">Tage ({pct1}%)</p>
              </div>
              <div className="text-center bg-green-50 rounded-lg p-4">
                <p className="text-xs font-medium text-green-600 mb-1">{name2}</p>
                <p className="text-3xl font-bold text-green-700">{days2}</p>
                <p className="text-xs text-green-500 mt-1">Tage ({pct2}%)</p>
              </div>
            </div>
            {total > 0 && (
              <div className="flex rounded-full overflow-hidden h-3 bg-gray-100">
                <div className="bg-blue-500 transition-all" style={{ width: `${pct1}%` }} />
                <div className="bg-green-500 transition-all" style={{ width: `${pct2}%` }} />
              </div>
            )}
            {diff !== 0 && (
              <p className="text-xs text-center text-gray-500">
                {diff > 0
                  ? `${name1} hat ${diff} Tag${diff === 1 ? "" : "e"} mehr als ${name2}`
                  : `${name2} hat ${Math.abs(diff)} Tag${Math.abs(diff) === 1 ? "" : "e"} mehr als ${name1}`}
              </p>
            )}
            {diff === 0 && total > 0 && (
              <p className="text-xs text-center text-gray-500">
                Beide Familien haben gleich viele Tage.
              </p>
            )}
            {total === 0 && (
              <p className="text-xs text-center text-gray-400">Noch keine Buchungen vorhanden.</p>
            )}
          </div>

          {/* Formular */}
          <div className="bg-white rounded-xl shadow p-6">
            <ZuweisungForm name1={name1} name2={name2} />
          </div>
        </div>

        {/* Right column: Kalender */}
        <ZuweisungKalender bookings={bookingEntries} name1={name1} name2={name2} />
      </div>

      {/* Buchungsliste mit Löschen */}
      <div className="mt-6 bg-white rounded-xl shadow p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Aktive Buchungen verwalten
        </h2>

        {allBookings.length === 0 ? (
          <p className="text-gray-400 text-sm">Keine aktiven Buchungen vorhanden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-4 font-medium">Familie</th>
                  <th className="pb-2 pr-4 font-medium">Zeitraum</th>
                  <th className="pb-2 pr-4 font-medium">Dauer</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allBookings.map((b) => {
                  const days = countDays(b.startDate, b.endDate);
                  const familyName =
                    b.family === Role.FAMILY_1 ? name1 : name2;
                  const familyColor =
                    b.family === Role.FAMILY_1
                      ? "text-blue-700 font-semibold"
                      : "text-green-700 font-semibold";
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className={`py-2.5 pr-4 ${familyColor}`}>{familyName}</td>
                      <td className="py-2.5 pr-4 text-gray-700">
                        {formatDateRange(b.startDate, b.endDate)}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-500">
                        {days} Tag{days === 1 ? "" : "e"}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(b.status)}`}
                        >
                          {statusLabel(b.status)}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <DeleteBookingButton bookingId={b.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
