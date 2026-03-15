"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";

export default function ZuweisungForm({ name1, name2 }: { name1: string; name2: string }) {
  const [family, setFamily] = useState<Role>(Role.FAMILY_1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!startDate || !endDate) return;
    setLoading(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ family, startDate, endDate, note, season: "WINTER" }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      const familyName = family === Role.FAMILY_1 ? name1 : name2;
      let msg = `Aufenthalt für ${familyName} wurde zugeteilt. Die Familie wurde benachrichtigt.`;
      if (data.cleaningDate) {
        const cleaning = new Date(data.cleaningDate).toLocaleDateString("de-DE", {
          weekday: "long", day: "2-digit", month: "long", year: "numeric",
        });
        msg += ` Reinigung automatisch geplant für ${cleaning}.`;
      }
      setSuccess(msg);
      setStartDate("");
      setEndDate("");
      setNote("");
      router.refresh();
    } else {
      try {
        const data = await res.json();
        setError(`Fehler: ${data.error || "Unbekannter Fehler"}`);
      } catch {
        setError(`Fehler beim Speichern (HTTP ${res.status}). Bitte erneut versuchen.`);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Familie</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setFamily(Role.FAMILY_1)}
            className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              family === Role.FAMILY_1
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
            }`}
          >
            {name1}
          </button>
          <button
            type="button"
            onClick={() => setFamily(Role.FAMILY_2)}
            className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              family === Role.FAMILY_2
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
            }`}
          >
            {name2}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Anreise</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Abreise</label>
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
          placeholder="z.B. Osterferien, Weihnachten..."
        />
      </div>

      {success && (
        <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          {success}
        </p>
      )}
      {error && (
        <p className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors"
      >
        {loading ? "Wird gespeichert..." : "Zuweisung erstellen"}
      </button>
    </form>
  );
}
