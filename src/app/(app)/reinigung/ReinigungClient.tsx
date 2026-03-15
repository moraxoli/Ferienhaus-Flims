"use client";

import { Booking, Cleaning } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type CleaningWithBooking = Cleaning & { booking: Booking | null };

export default function ReinigungClient({
  cleanings,
}: {
  cleanings: CleaningWithBooking[];
}) {
  const [newDate, setNewDate] = useState("");
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const router = useRouter();

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!newDate) return;
    setLoading(true);
    await fetch("/api/cleaning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, note: newNote }),
    });
    setLoading(false);
    setNewDate("");
    setNewNote("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch("/api/cleaning", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setConfirmId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Reinigung bestellen</h2>
        <form onSubmit={handleOrder} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notiz (optional)</label>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="z.B. Fenster reinigen"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm"
          >
            {loading ? "..." : "Bestellen"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Alle Reinigungstermine</h2>
        {cleanings.length === 0 ? (
          <p className="text-gray-500 text-sm">Keine Termine vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {cleanings.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="font-medium text-gray-900">
                    {new Date(c.date).toLocaleDateString("de-DE", {
                      weekday: "long", day: "2-digit", month: "long", year: "numeric",
                    })}
                  </span>
                  {c.booking && (
                    <span className="text-xs text-gray-400 ml-2">
                      (nach Aufenthalt {new Date(c.booking.startDate).toLocaleDateString("de-DE")} – {new Date(c.booking.endDate).toLocaleDateString("de-DE")})
                    </span>
                  )}
                  {c.note && <p className="text-sm text-gray-500 mt-0.5">{c.note}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {confirmId === c.id ? (
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Wirklich löschen?</span>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800"
                      >
                        Ja
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Nein
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmId(c.id)}
                      className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Löschen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
