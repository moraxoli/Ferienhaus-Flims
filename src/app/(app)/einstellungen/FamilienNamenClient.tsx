"use client";

import { useState } from "react";
import { Role } from "@prisma/client";

export default function FamilienNamenClient({
  initialName1,
  initialName2,
}: {
  initialName1: string;
  initialName2: string;
}) {
  const [name1, setName1] = useState(initialName1);
  const [name2, setName2] = useState(initialName2);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function save(role: Role, name: string) {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, name }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage({ type: "success", text: "Name gespeichert." });
    } else {
      setMessage({ type: "error", text: data.error || "Fehler beim Speichern." });
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Familiennamen verwalten</h2>
      <p className="text-sm text-gray-500">
        Diese Namen werden überall in der App angezeigt (Kalender, Anfragen, Sidebar).
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Familie 1</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name1}
              onChange={(e) => setName1(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => save(Role.FAMILY_1, name1)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Speichern
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Familie 2</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name2}
              onChange={(e) => setName2(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => save(Role.FAMILY_2, name2)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Speichern
            </button>
          </div>
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
    </div>
  );
}
