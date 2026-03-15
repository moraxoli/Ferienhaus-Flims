"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AnfrageFormular({
  myFamily,
  otherFamily,
}: {
  myFamily: string;
  otherFamily: string;
}) {
  const [vorname, setVorname] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [withCleaning, setWithCleaning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Berechne den nächsten Montag nach Abreise (nur zur Anzeige)
  function nextMondayDisplay(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1);
    while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1);
    return d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!startDate || !endDate || !vorname.trim()) return;

    if (new Date(endDate) < new Date(startDate)) {
      setError("Das Abreisedatum muss nach dem Anreisedatum liegen.");
      return;
    }

    setLoading(true);
    const fullNote = vorname.trim() + (note.trim() ? ` – ${note.trim()}` : "");
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, note: fullNote, withCleaning, season: "SUMMER" }),
    });
    setLoading(false);

    if (res.ok) {
      setSuccess(true);
      setVorname("");
      setStartDate("");
      setEndDate("");
      setNote("");
      setWithCleaning(true);
      setTimeout(() => { setSuccess(false); router.refresh(); }, 4000);
    } else {
      setError("Fehler beim Senden. Bitte erneut versuchen.");
    }
  }

  const cleaningDay = endDate ? nextMondayDisplay(endDate) : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dein Vorname <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={vorname}
          onChange={(e) => setVorname(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="z.B. Thomas"
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          Anfrage von <strong>{myFamily}</strong> → wird zur Genehmigung an <strong>{otherFamily}</strong> gesendet
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Anreise <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Abreise <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notiz (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="z.B. Geburtstagsfeier, Familienurlaub..."
        />
      </div>

      {/* Reinigungsfrage */}
      <div
        className={`rounded-lg border p-4 transition-colors ${
          withCleaning ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"
        }`}
      >
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={withCleaning}
            onChange={(e) => setWithCleaning(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
          />
          <div>
            <span className="text-sm font-medium text-gray-800">
              Reinigung nach dem Aufenthalt buchen
            </span>
            {withCleaning && cleaningDay ? (
              <p className="text-xs text-orange-700 mt-0.5">
                Reinigung wird automatisch für <strong>{cleaningDay}</strong> eingeplant,
                sobald die Anfrage genehmigt wird.
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-0.5">
                Keine automatische Reinigung — du kannst sie manuell im Bereich
                &laquo;Reinigung&raquo; bestellen.
              </p>
            )}
          </div>
        </label>
      </div>

      {error && (
        <p className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
      )}
      {success && (
        <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          ✓ Anfrage gestellt! <strong>{otherFamily}</strong> wurde zur Genehmigung benachrichtigt.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
      >
        {loading ? "Wird gesendet..." : "Anfrage stellen"}
      </button>
    </form>
  );
}
