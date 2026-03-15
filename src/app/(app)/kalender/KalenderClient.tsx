"use client";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { de } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Booking, Cleaning, Presence, Role, BookingStatus } from "@prisma/client";
import { Session } from "next-auth";
import { roleColor, roleColorLight, statusLabel } from "@/lib/utils";
import { FamilyNames } from "@/lib/familyNames";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { de },
});

type BookingWithDetails = Booking & { cleaning: Cleaning | null; presences: Presence[] };

type CalEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  type: "booking" | "cleaning" | "presence";
  data: BookingWithDetails | Cleaning | (Presence & { booking: BookingWithDetails });
};

function toInputDate(date: Date | string): string {
  return new Date(date).toISOString().slice(0, 10);
}

export default function KalenderClient({
  bookings,
  cleanings,
  session,
  familyNames,
}: {
  bookings: BookingWithDetails[];
  cleanings: Cleaning[];
  session: Session;
  familyNames: FamilyNames;
}) {
  const [selected, setSelected] = useState<CalEvent | null>(null);
  const [deletingCleaning, setDeletingCleaning] = useState(false);
  const [confirmDeleteCleaning, setConfirmDeleteCleaning] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState(false);
  const [confirmDeleteBooking, setConfirmDeleteBooking] = useState(false);
  const [calDate, setCalDate] = useState(new Date());

  // Presence form state
  const [addingPresenceTo, setAddingPresenceTo] = useState<BookingWithDetails | null>(null);
  const [presenceName, setPresenceName] = useState("");
  const [presenceStart, setPresenceStart] = useState("");
  const [presenceEnd, setPresenceEnd] = useState("");
  const [presenceError, setPresenceError] = useState("");
  const [savingPresence, setSavingPresence] = useState(false);

  // Presence delete state
  const [deletingPresence, setDeletingPresence] = useState(false);
  const [confirmDeletePresence, setConfirmDeletePresence] = useState(false);

  const router = useRouter();

  function closeModal() {
    setSelected(null);
    setConfirmDeleteCleaning(false);
    setConfirmDeleteBooking(false);
    setConfirmDeletePresence(false);
  }

  function closePresenceForm() {
    setAddingPresenceTo(null);
    setPresenceName("");
    setPresenceStart("");
    setPresenceEnd("");
    setPresenceError("");
  }

  const bookingEvents: CalEvent[] = bookings.map((b) => ({
    id: b.id,
    title:
      b.status === BookingStatus.REQUESTED
        ? `${familyNames[b.family]} – Bestätigung ausstehend`
        : familyNames[b.family],
    start: new Date(b.startDate),
    end: new Date(b.endDate),
    color:
      b.status === BookingStatus.REQUESTED
        ? "#9ca3af"
        : roleColor(b.family),
    data: b,
    type: "booking" as const,
  }));

  const cleaningEvents: CalEvent[] = cleanings.map((c) => ({
    id: c.id,
    title: "🧹 Reinigung",
    start: new Date(c.date),
    end: new Date(c.date),
    color: "#f97316",
    data: c,
    type: "cleaning" as const,
  }));

  // Presence-Events als Einzeltag-Events (je ein Event pro Tag) –
  // so werden sie wie Reinigungstermine UNTER den Mehrtags-Buchungsbalken gerendert.
  const presenceEvents: CalEvent[] = bookings.flatMap((b) =>
    b.presences.flatMap((p) => {
      const days: CalEvent[] = [];
      const cur = new Date(new Date(p.startDate).toISOString().slice(0, 10) + "T12:00:00");
      const endDay = new Date(new Date(p.endDate).toISOString().slice(0, 10) + "T12:00:00");
      while (cur <= endDay) {
        const day = new Date(cur);
        days.push({
          id: `${p.id}-${day.toISOString().slice(0, 10)}`,
          title: `👤 ${p.memberName}`,
          start: day,
          end: day,
          color: roleColorLight(b.family),
          type: "presence" as const,
          data: { ...p, booking: b },
        });
        cur.setDate(cur.getDate() + 1);
      }
      return days;
    })
  );

  // Buchungen zuerst, dann Anwesenheiten
  const events = [...bookingEvents, ...cleaningEvents, ...presenceEvents];

  const EventComponent = ({ event }: { event: object }) => {
    const e = event as CalEvent;
    const isPresence = e.type === "presence";
    return (
      <span
        className={isPresence ? "rbc-presence-event" : "rbc-booking-event"}
        style={{ fontSize: "0.75rem", color: isPresence ? "#374151" : "white" }}
      >
        {e.title}
      </span>
    );
  };

  return (
    <div>
      {/* Legende */}
      <div className="flex flex-wrap gap-4 mb-4">
        <LegendItem color={roleColor(Role.FAMILY_1)} label={familyNames[Role.FAMILY_1]} />
        <LegendItem color={roleColorLight(Role.FAMILY_1)} label="Anwesenheit" border={roleColor(Role.FAMILY_1)} />
        <LegendItem color={roleColor(Role.FAMILY_2)} label={familyNames[Role.FAMILY_2]} />
        <LegendItem color={roleColorLight(Role.FAMILY_2)} label="Anwesenheit" border={roleColor(Role.FAMILY_2)} />
        <LegendItem color="#9ca3af" label="Bestätigung ausstehend" />
        <LegendItem color="#f97316" label="Reinigung" />
      </div>

      <div className="bg-white rounded-xl shadow p-4" style={{ height: 600 }}>
        <Calendar
          localizer={localizer}
          events={events}
          culture="de"
          views={["month"]}
          defaultView="month"
          components={{ event: EventComponent as React.ComponentType<{ event: object }> }}
          date={calDate}
          onNavigate={(date) => setCalDate(date)}
          messages={{
            next: "Weiter",
            previous: "Zurück",
            today: "Heute",
            noEventsInRange: "Keine Buchungen in diesem Zeitraum.",
          }}
          eventPropGetter={(event) => {
            const e = event as CalEvent;
            if (e.type === "presence") {
              const p = e.data as Presence & { booking: BookingWithDetails };
              return {
                style: {
                  backgroundColor: e.color,
                  border: `1px solid ${roleColor(p.booking.family)}`,
                  borderRadius: "4px",
                  color: "#374151",
                  fontSize: "0.75rem",
                },
              };
            }
            return {
              style: {
                backgroundColor: e.color,
                border: "none",
                borderRadius: "4px",
              },
            };
          }}
          onSelectEvent={(event) => {
            setSelected(event as CalEvent);
            setConfirmDeleteBooking(false);
            setConfirmDeleteCleaning(false);
            setConfirmDeletePresence(false);
          }}
          popup
        />
      </div>

      {/* ── Event-Detail-Modal ── */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4">{selected.title}</h2>

            {/* ── Buchung ── */}
            {selected.type === "booking" && (() => {
              const b = selected.data as BookingWithDetails;
              const canDelete =
                session.user.role === Role.ADMIN || b.family === session.user.role;
              const canAddPresence =
                (session.user.role === Role.ADMIN || b.family === session.user.role) &&
                (b.status === BookingStatus.APPROVED || b.status === BookingStatus.ASSIGNED || b.status === BookingStatus.RELEASED);
              return (
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-medium">Familie:</span> {familyNames[b.family]}</p>
                  <p>
                    <span className="font-medium">Zeitraum:</span>{" "}
                    {new Date(b.startDate).toLocaleDateString("de-DE")} – {new Date(b.endDate).toLocaleDateString("de-DE")}
                  </p>
                  <p><span className="font-medium">Status:</span> {statusLabel(b.status)}</p>
                  <p><span className="font-medium">Saison:</span> {b.season === "WINTER" ? "Wintersaison" : "Sommersaison"}</p>
                  {b.note && <p><span className="font-medium">Notiz:</span> {b.note}</p>}
                  {b.cleaning && (
                    <p><span className="font-medium">Reinigung:</span> {new Date(b.cleaning.date).toLocaleDateString("de-DE")}</p>
                  )}

                  {/* Anwesenheiten dieser Buchung */}
                  {b.presences.length > 0 && (
                    <div className="pt-2">
                      <p className="font-medium mb-1">Anwesenheiten:</p>
                      <ul className="space-y-1">
                        {b.presences.map((p) => (
                          <li key={p.id} className="flex items-center gap-2 text-xs bg-gray-50 rounded px-2 py-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: roleColorLight(b.family), border: `1px solid ${roleColor(b.family)}` }}
                            />
                            <span className="font-medium">{p.memberName}</span>
                            <span className="text-gray-500">
                              {new Date(p.startDate).toLocaleDateString("de-DE")} – {new Date(p.endDate).toLocaleDateString("de-DE")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Anwesenheit hinzufügen */}
                  {canAddPresence && (
                    <button
                      onClick={() => {
                        setAddingPresenceTo(b);
                        closeModal();
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-2 rounded-lg text-sm font-medium transition-colors mt-2"
                    >
                      + Anwesenheit eintragen
                    </button>
                  )}

                  {/* Buchung löschen */}
                  {canDelete && (
                    <div className="pt-1">
                      {!confirmDeleteBooking ? (
                        <button
                          onClick={() => setConfirmDeleteBooking(true)}
                          className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          🗑 Buchung löschen
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-red-600 text-center font-medium">Buchung wirklich löschen?</p>
                          <div className="flex gap-2">
                            <button
                              disabled={deletingBooking}
                              onClick={async () => {
                                setDeletingBooking(true);
                                await fetch(`/api/bookings/${b.id}`, { method: "DELETE" });
                                setDeletingBooking(false);
                                closeModal();
                                router.refresh();
                              }}
                              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              {deletingBooking ? "Wird gelöscht..." : "Ja, löschen"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteBooking(false)}
                              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm transition-colors"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Reinigung ── */}
            {selected.type === "cleaning" && (() => {
              const c = selected.data as Cleaning;
              return (
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-medium">Datum:</span> {new Date(c.date).toLocaleDateString("de-DE")}</p>
                  {c.note && <p><span className="font-medium">Notiz:</span> {c.note}</p>}

                  {session.user.role === Role.ADMIN && (
                    <div className="pt-3">
                      {!confirmDeleteCleaning ? (
                        <button
                          onClick={() => setConfirmDeleteCleaning(true)}
                          className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          🗑 Reinigung löschen
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-red-600 text-center font-medium">Reinigung wirklich löschen?</p>
                          <div className="flex gap-2">
                            <button
                              disabled={deletingCleaning}
                              onClick={async () => {
                                setDeletingCleaning(true);
                                await fetch("/api/cleaning", {
                                  method: "DELETE",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: c.id }),
                                });
                                setDeletingCleaning(false);
                                closeModal();
                                router.refresh();
                              }}
                              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              {deletingCleaning ? "Wird gelöscht..." : "Ja, löschen"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteCleaning(false)}
                              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm transition-colors"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Anwesenheit ── */}
            {selected.type === "presence" && (() => {
              const p = selected.data as Presence & { booking: BookingWithDetails };
              const canDelete =
                session.user.role === Role.ADMIN || p.booking.family === session.user.role;
              return (
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-medium">Person:</span> {p.memberName}</p>
                  <p>
                    <span className="font-medium">Zeitraum:</span>{" "}
                    {new Date(p.startDate).toLocaleDateString("de-DE")} – {new Date(p.endDate).toLocaleDateString("de-DE")}
                  </p>
                  <p><span className="font-medium">Familie:</span> {familyNames[p.booking.family]}</p>
                  <p className="text-gray-500 text-xs">
                    Buchung: {new Date(p.booking.startDate).toLocaleDateString("de-DE")} – {new Date(p.booking.endDate).toLocaleDateString("de-DE")}
                  </p>

                  {canDelete && (
                    <div className="pt-3">
                      {!confirmDeletePresence ? (
                        <button
                          onClick={() => setConfirmDeletePresence(true)}
                          className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          🗑 Anwesenheit löschen
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-red-600 text-center font-medium">Anwesenheit wirklich löschen?</p>
                          <div className="flex gap-2">
                            <button
                              disabled={deletingPresence}
                              onClick={async () => {
                                setDeletingPresence(true);
                                await fetch(`/api/presences/${p.id}`, { method: "DELETE" });
                                setDeletingPresence(false);
                                closeModal();
                                router.refresh();
                              }}
                              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              {deletingPresence ? "Wird gelöscht..." : "Ja, löschen"}
                            </button>
                            <button
                              onClick={() => setConfirmDeletePresence(false)}
                              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm transition-colors"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <button
              onClick={closeModal}
              className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* ── Anwesenheit eintragen Modal ── */}
      {addingPresenceTo && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => { closePresenceForm(); }}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-1">Anwesenheit eintragen</h2>
            <p className="text-sm text-gray-500 mb-4">
              {familyNames[addingPresenceTo.family]} ·{" "}
              {new Date(addingPresenceTo.startDate).toLocaleDateString("de-DE")} – {new Date(addingPresenceTo.endDate).toLocaleDateString("de-DE")}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name der Person</label>
                <input
                  type="text"
                  value={presenceName}
                  onChange={(e) => setPresenceName(e.target.value)}
                  placeholder="z.B. Oma, Klaus, ..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Von</label>
                <input
                  type="date"
                  value={presenceStart}
                  min={toInputDate(addingPresenceTo.startDate)}
                  max={toInputDate(addingPresenceTo.endDate)}
                  onChange={(e) => setPresenceStart(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bis</label>
                <input
                  type="date"
                  value={presenceEnd}
                  min={presenceStart || toInputDate(addingPresenceTo.startDate)}
                  max={toInputDate(addingPresenceTo.endDate)}
                  onChange={(e) => setPresenceEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {presenceError && (
                <p className="text-xs text-red-600">{presenceError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  disabled={savingPresence}
                  onClick={async () => {
                    setPresenceError("");
                    if (!presenceName.trim() || !presenceStart || !presenceEnd) {
                      setPresenceError("Bitte alle Felder ausfüllen.");
                      return;
                    }
                    setSavingPresence(true);
                    const res = await fetch("/api/presences", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        bookingId: addingPresenceTo.id,
                        memberName: presenceName.trim(),
                        startDate: presenceStart,
                        endDate: presenceEnd,
                      }),
                    });
                    setSavingPresence(false);
                    if (!res.ok) {
                      const data = await res.json();
                      setPresenceError(data.error ?? "Fehler beim Speichern.");
                      return;
                    }
                    closePresenceForm();
                    router.refresh();
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {savingPresence ? "Wird gespeichert..." : "Speichern"}
                </button>
                <button
                  onClick={closePresenceForm}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label, border }: { color: string; label: string; border?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div
        className="w-4 h-4 rounded"
        style={{ backgroundColor: color, border: border ? `1px solid ${border}` : undefined }}
      />
      {label}
    </div>
  );
}
