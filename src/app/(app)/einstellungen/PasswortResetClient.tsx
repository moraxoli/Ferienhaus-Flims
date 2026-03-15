"use client";

import { useState } from "react";

type FamilyUser = {
  id: string;
  name: string;
  email: string;
  plainPassword: string | null;
};

export default function PasswortResetClient({
  users,
}: {
  users: FamilyUser[];
}) {
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPasswords, setCurrentPasswords] = useState<Record<string, string | null>>(
    Object.fromEntries(users.map((u) => [u.id, u.plainPassword]))
  );

  async function handleReset(userId: string) {
    const pw = passwords[userId] ?? "";
    if (pw.length < 6) {
      setErrors((e) => ({ ...e, [userId]: "Mindestens 6 Zeichen erforderlich" }));
      return;
    }
    setErrors((e) => ({ ...e, [userId]: "" }));
    setSuccess((s) => ({ ...s, [userId]: "" }));
    setLoading((l) => ({ ...l, [userId]: true }));

    const res = await fetch("/api/admin/users/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newPassword: pw }),
    });

    setLoading((l) => ({ ...l, [userId]: false }));

    if (res.ok) {
      setCurrentPasswords((p) => ({ ...p, [userId]: pw }));
      setSuccess((s) => ({ ...s, [userId]: "Passwort erfolgreich geändert" }));
      setPasswords((p) => ({ ...p, [userId]: "" }));
    } else {
      const data = await res.json().catch(() => ({}));
      setErrors((e) => ({ ...e, [userId]: data.error || "Fehler beim Ändern" }));
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        Login-Zugangsdaten
      </h2>
      <p className="text-xs text-gray-400">
        Aktuelle Zugangsdaten der Familien-Konten. Du kannst Passwörter hier zurücksetzen.
      </p>

      <div className="space-y-6">
        {users.map((user) => (
          <div key={user.id} className="space-y-3 border border-gray-100 rounded-lg p-4 bg-gray-50">
            {/* Aktueller Stand */}
            <p className="text-sm font-semibold text-gray-800">{user.name}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-1">Loginname</p>
                <p className="font-mono bg-white border border-gray-200 rounded px-2 py-1 text-gray-800 text-xs">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Passwort</p>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded px-2 py-1">
                  <span className="font-mono text-gray-800 text-xs flex-1">
                    {currentPasswords[user.id]
                      ? (showPw[user.id] ? currentPasswords[user.id] : "••••••••")
                      : <span className="text-gray-400 italic">unbekannt</span>
                    }
                  </span>
                  {currentPasswords[user.id] && (
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => ({ ...s, [user.id]: !s[user.id] }))}
                      className="text-gray-400 hover:text-gray-600 text-xs"
                    >
                      {showPw[user.id] ? "🙈" : "👁"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Passwort ändern */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={passwords[user.id] ?? ""}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, [user.id]: e.target.value }))
                }
                placeholder="Neues Passwort setzen (min. 6 Zeichen)"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleReset(user.id);
                }}
              />
              <button
                onClick={() => handleReset(user.id)}
                disabled={loading[user.id]}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                {loading[user.id] ? "Wird gespeichert..." : "Setzen"}
              </button>
            </div>
            {errors[user.id] && (
              <p className="text-xs text-red-600">{errors[user.id]}</p>
            )}
            {success[user.id] && (
              <p className="text-xs text-green-600">✓ {success[user.id]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
