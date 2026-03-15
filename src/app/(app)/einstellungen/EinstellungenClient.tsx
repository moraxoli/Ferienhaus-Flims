"use client";

import { useState } from "react";

export default function EinstellungenClient({
  currentName,
  currentEmail,
}: {
  currentName: string;
  currentEmail: string;
}) {
  const [email, setEmail] = useState(currentEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Die neuen Passwörter stimmen nicht überein." });
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setMessage({ type: "error", text: "Das neue Passwort muss mindestens 6 Zeichen lang sein." });
      return;
    }

    setLoading(true);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, currentPassword, newPassword }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setMessage({
        type: "success",
        text: "Einstellungen gespeichert. Bitte neu anmelden damit alle Änderungen übernommen werden.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setMessage({ type: "error", text: data.error || "Fehler beim Speichern." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Login-Daten</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Anzeigename</label>
          <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50">
            {currentName}
          </div>
          <p className="text-xs text-gray-400 mt-1">Wird im Kalender, Sidebar und bei Buchungen angezeigt. Nur vom Administrator änderbar.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loginname</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Dein Loginname"
            required
          />
          <p className="text-xs text-gray-400 mt-1">Wird für den Login verwendet.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Passwort ändern</h2>
        <p className="text-sm text-gray-500">Nur ausfüllen wenn du das Passwort ändern möchtest.</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Aktuelles Passwort</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Neues Passwort</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mindestens 6 Zeichen"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Neues Passwort bestätigen</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>
      </div>

      {message && (
        <p className={`text-sm px-4 py-2 rounded-lg border ${
          message.type === "success"
            ? "text-green-700 bg-green-50 border-green-200"
            : "text-red-700 bg-red-50 border-red-200"
        }`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors"
      >
        {loading ? "Speichern..." : "Speichern"}
      </button>
    </form>
  );
}
