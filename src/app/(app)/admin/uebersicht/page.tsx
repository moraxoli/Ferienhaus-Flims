import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getFamilyNames } from "@/lib/familyNames";
import { formatDateRange, statusColor, statusLabel } from "@/lib/utils";
import DeleteBookingButton from "./DeleteBookingButton";
import RejectBookingButton from "./RejectBookingButton";

export default async function UebersichtPage() {
  const session = await auth();
  if (session?.user.role !== Role.ADMIN) redirect("/kalender");

  const [bookings, familyNames] = await Promise.all([
    db.booking.findMany({
      include: { cleaning: true },
      orderBy: { startDate: "asc" },
    }),
    getFamilyNames(),
  ]);

  const winter = bookings.filter((b) => b.season === "WINTER");
  const summer = bookings.filter((b) => b.season === "SUMMER");

  return (
    <div className="p-6 max-w-5xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Alle Buchungen verwalten</h1>
      <Section title="Wintersaison" bookings={winter} familyNames={familyNames} />
      <Section title="Sommersaison" bookings={summer} familyNames={familyNames} />
    </div>
  );
}

function Section({ title, bookings, familyNames }: { title: string; bookings: any[]; familyNames: Record<string, string> }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {bookings.length === 0 ? (
        <p className="text-gray-500 text-sm">Keine Buchungen.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 pr-4">Familie</th>
              <th className="pb-2 pr-4">Zeitraum</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 pr-4">Reinigung</th>
              <th className="pb-2">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="py-2 pr-4 font-medium">{familyNames[b.family]}</td>
                <td className="py-2 pr-4">{formatDateRange(b.startDate, b.endDate)}</td>
                <td className="py-2 pr-4">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(b.status)}`}>
                    {statusLabel(b.status)}
                  </span>
                </td>
                <td className="py-2 pr-4 text-gray-500">
                  {b.cleaning ? new Date(b.cleaning.date).toLocaleDateString("de-DE") : "–"}
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-3">
                    {(b.status === "REQUESTED" || b.status === "APPROVED") && (
                      <RejectBookingButton bookingId={b.id} />
                    )}
                    <DeleteBookingButton bookingId={b.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
