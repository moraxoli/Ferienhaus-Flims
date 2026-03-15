"use client";

import { useState } from "react";

export default function ReinigungsEmailClient({
  initialEmail,
}: {
  initialEmail: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cleaningEmail: email }),
    });
    setLoading(false);
    setSaved(true);
  }

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl shadow p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        Reinigungsfirma
      </h2>
      <p className="text-xs text-gray-400">
        E-Mail-Adresse der Reinigungsfachfrau. Änderungen am Reinigungsplan werden an diese Adresse gesendet.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setSaved(false); }}
          placeholder="reinigung@beispiel.ch"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          {loading ? "Speichern..." : "Speichern"}
        </button>
      </div>
      {saved && <p className="text-xs text-green-600">✓ Gespeichert</p>}
    </form>
  );
}
