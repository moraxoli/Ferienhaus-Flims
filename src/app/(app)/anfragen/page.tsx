import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookingStatus, Role, Season } from "@prisma/client";
import { formatDateRange, statusColor, statusLabel } from "@/lib/utils";
import { getFamilyNames } from "@/lib/familyNames";
import AnfrageFormular from "./AnfrageFormular";
import AnfrageActions from "./AnfrageActions";

export default async function AnfragenPage() {
  const session = await auth();
  const role = session!.user.role;
  const familyNames = await getFamilyNames();

  // Explizit auf FAMILY_1/FAMILY_2 prüfen – nie eigene Buchungen anzeigen
  const isFamily = role === Role.FAMILY_1 || role === Role.FAMILY_2;

  const pendingFromOther = isFamily
    ? await db.booking.findMany({
        where: {
          season: Season.SUMMER,
          status: BookingStatus.REQUESTED,
          family: { not: role }, // nur Anfragen der ANDEREN Familie
        },
        orderBy: { startDate: "asc" },
      })
    : [];

  const allRequests = await db.booking.findMany({
    where: {
      season: Season.SUMMER,
      ...(isFamily ? { family: role } : {}),
    },
    orderBy: { startDate: "asc" },
  });

  const otherRole = role === Role.FAMILY_1 ? Role.FAMILY_2 : Role.FAMILY_1;

  return (
    <div className="p-6 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Buchungsanfragen</h1>
        <p className="text-gray-500 text-sm">First come, first served – Genehmigung durch die andere Familie erforderlich</p>
      </div>

      {isFamily && (
        <>
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-1">Neue Anfrage stellen</h2>
            <p className="text-sm text-gray-500 mb-5">
              Du bist eingeloggt als <span className="font-medium text-gray-700">{familyNames[role]}</span>.
              Die Anfrage wird zur Genehmigung an <span className="font-medium text-gray-700">{familyNames[otherRole]}</span> gesendet.
            </p>
            <AnfrageFormular myFamily={familyNames[role]} otherFamily={familyNames[otherRole]} />
          </div>

          {pendingFromOther.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-1">
                Deine Genehmigung erforderlich
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {familyNames[otherRole]} hat folgende Anfragen gestellt – bitte genehmige oder lehne sie ab:
              </p>
              <div className="space-y-4">
                {pendingFromOther.map((b) => (
                  <div key={b.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {formatDateRange(b.startDate, b.endDate)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Anfrage von <span className="font-medium">{familyNames[b.family]}</span>
                        </p>
                        {b.note && <p className="text-sm text-gray-700 mt-1">👤 {b.note}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          Gestellt am {new Date(b.createdAt).toLocaleDateString("de-DE")}
                        </p>
                      </div>
                      <AnfrageActions bookingId={b.id} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          {role === Role.ADMIN ? "Alle Sommeranfragen" : "Meine Anfragen"}
        </h2>
        {allRequests.length === 0 ? (
          <p className="text-gray-500 text-sm">Keine Anfragen vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {allRequests.map((b) => (
              <div key={b.id} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  {role === Role.ADMIN && (
                    <p className="text-xs text-gray-500 mb-0.5">{familyNames[b.family]}</p>
                  )}
                  <span className="font-medium text-gray-900">{formatDateRange(b.startDate, b.endDate)}</span>
                  {b.note && <p className="text-sm text-gray-500 mt-0.5">👤 {b.note}</p>}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(b.status)}`}>
                  {statusLabel(b.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
