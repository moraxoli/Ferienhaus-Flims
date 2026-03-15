"use client";

import { Booking, Cleaning } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type CleaningWithBooking = Cleaning & { booking: Booking | null; createdById: string | null };
type Change =
  | { type: "added"; cleaning: CleaningWithBooking }
  | { type: "removed"; cleaning: CleaningWithBooking };

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("de-DE", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

function buildEmailHtml(changes: Change[], upcoming: CleaningWithBooking[], customText: string): string {
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const changesHtml = changes.length > 0 ? `
    <h3 style="color:#1e293b;margin:0 0 12px 0;font-size:15px">Änderungen</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      ${changes.map((ch) => {
        const isNew = ch.type === "added";
        return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:${isNew ? "#16a34a" : "#dc2626"};${!isNew ? "text-decoration:line-through" : ""}">
          ${isNew ? "✚" : "✖"} ${formatDate(ch.cleaning.date)}
          ${ch.cleaning.note ? `<span style="color:#64748b;font-size:12px"> — ${ch.cleaning.note}</span>` : ""}
        </td></tr>`;
      }).join("")}
    </table>` : "";
  const upcomingHtml = `
    <h3 style="color:#1e293b;margin:0 0 12px 0;font-size:15px">Alle bevorstehenden Reinigungstermine</h3>
    <table style="width:100%;border-collapse:collapse">
      ${upcoming.length === 0
        ? `<tr><td style="padding:8px 12px;color:#94a3b8;font-style:italic">Keine Termine geplant.</td></tr>`
        : upcoming.map((c) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#1e293b">
            ${formatDate(c.date)}${c.note ? `<span style="color:#64748b;font-size:12px"> — ${c.note}</span>` : ""}
          </td></tr>`).join("")}
    </table>`;
  const customHtml = customText.trim()
    ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px 16px;margin-bottom:24px;color:#166534;font-size:14px;white-space:pre-wrap">${customText}</div>`
    : "";
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <div style="background:#1e40af;padding:20px;border-radius:8px 8px 0 0">
      <h1 style="color:white;margin:0;font-size:20px">Ferienhaus Flims</h1>
      <p style="color:#bfdbfe;margin:4px 0 0 0;font-size:13px">Reinigungsplan – Aktualisierung</p>
    </div>
    <div style="background:#f8fafc;padding:24px;border-radius:0 0 8px 8px">
      ${customHtml}${changesHtml}${upcomingHtml}
      <div style="margin-top:24px">
        <a href="${appUrl}/reinigung" style="display:inline-block;padding:10px 20px;background:#1e40af;color:white;text-decoration:none;border-radius:6px;font-size:14px">Zur App</a>
      </div>
    </div>
  </div>`;
}

export default function ReinigungClient({
  cleanings,
  isAdmin,
  currentUserId,
  cleaningEmail,
}: {
  cleanings: CleaningWithBooking[];
  isAdmin: boolean;
  currentUserId: string;
  cleaningEmail: string;
}) {
  const [newDate, setNewDate] = useState("");
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [changes, setChanges] = useState<Change[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [customText, setCustomText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [currentCleanings, setCurrentCleanings] = useState<CleaningWithBooking[]>(cleanings);
  const router = useRouter();

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!newDate) return;
    setLoading(true);
    const res = await fetch("/api/cleaning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, note: newNote }),
    });
    const newCleaning: CleaningWithBooking = await res.json();
    setLoading(false);
    setNewDate("");
    setNewNote("");
    setCurrentCleanings((prev) =>
      [...prev, newCleaning].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
    setChanges((prev) => [...prev, { type: "added", cleaning: newCleaning }]);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const removed = currentCleanings.find((c) => c.id === id);
    await fetch("/api/cleaning", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setConfirmId(null);
    if (removed) {
      setCurrentCleanings((prev) => prev.filter((c) => c.id !== id));
      setChanges((prev) => [...prev, { type: "removed", cleaning: removed }]);
    }
    router.refresh();
  }

  function startEdit(c: CleaningWithBooking) {
    setEditId(c.id);
    setEditDate(new Date(c.date).toISOString().split("T")[0]);
    setEditNote(c.note ?? "");
    setConfirmId(null);
  }

  async function handleEdit(id: string) {
    const original = currentCleanings.find((c) => c.id === id);
    setEditLoading(true);
    const res = await fetch("/api/cleaning", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, date: editDate, note: editNote }),
    });
    const updated: CleaningWithBooking = await res.json();
    setEditLoading(false);
    setEditId(null);
    setCurrentCleanings((prev) =>
      prev.map((c) => (c.id === id ? updated : c))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
    if (original) {
      setChanges((prev) => [
        ...prev,
        { type: "removed", cleaning: original },
        { type: "added", cleaning: updated },
      ]);
    }
    router.refresh();
  }

  async function handleSend() {
    setSending(true);
    setSent(false);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const upcoming = currentCleanings.filter((c) => new Date(c.date) >= today);
    await fetch("/api/cleaning/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: cleaningEmail,
        subject: "Ferienhaus Flims – Reinigungsplan aktualisiert",
        html: buildEmailHtml(changes, upcoming, customText),
      }),
    });
    setSending(false);
    setSent(true);
    setChanges([]);
    setCustomText("");
    setTimeout(() => { setShowModal(false); setSent(false); }, 2000);
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = currentCleanings.filter((c) => new Date(c.date) >= today);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Reinigung bestellen</h2>
          <form onSubmit={handleOrder} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notiz (optional)</label>
              <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="z.B. Fenster reinigen" />
            </div>
            <button type="submit" disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm">
              {loading ? "..." : "Bestellen"}
            </button>
          </form>
        </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold">Alle Reinigungstermine</h2>
          {isAdmin && (
            <button onClick={() => setShowModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                changes.length > 0 ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}>
              ✉ Reinigungsfirma informieren
              {changes.length > 0 && (
                <span className="bg-white text-orange-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {changes.length}
                </span>
              )}
            </button>
          )}
        </div>
        {currentCleanings.length === 0 ? (
          <p className="text-gray-500 text-sm">Keine Termine vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {currentCleanings.map((c) => {
              const isNew = changes.some((ch) => ch.type === "added" && ch.cleaning.id === c.id);
              const canEdit = isAdmin || c.createdById === currentUserId;
              const isEditing = editId === c.id;
              return (
                <div key={c.id} className={`py-2 border-b border-gray-100 last:border-0 ${isNew ? "bg-green-50 -mx-2 px-2 rounded-lg" : ""}`}>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2 items-end">
                      <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <input type="text" value={editNote} onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Notiz" className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 flex-1 min-w-[120px]" />
                      <button onClick={() => handleEdit(c.id)} disabled={editLoading}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg">
                        {editLoading ? "..." : "Speichern"}
                      </button>
                      <button onClick={() => setEditId(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg">
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className={`font-medium ${isNew ? "text-green-700" : "text-gray-900"}`}>
                          {isNew && <span className="text-green-500 mr-1 text-xs font-semibold">Neu</span>}
                          {formatDate(c.date)}
                        </span>
                        {c.booking && (
                          <span className="text-xs text-gray-400 ml-2">
                            (nach Aufenthalt {new Date(c.booking.startDate).toLocaleDateString("de-DE")} – {new Date(c.booking.endDate).toLocaleDateString("de-DE")})
                          </span>
                        )}
                        {c.note && <p className="text-sm text-gray-500 mt-0.5">{c.note}</p>}
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-2 shrink-0">
                          {confirmId === c.id ? (
                            <span className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">Wirklich löschen?</span>
                              <button onClick={() => handleDelete(c.id)} className="text-xs font-semibold text-red-600 hover:text-red-800">Ja</button>
                              <button onClick={() => setConfirmId(null)} className="text-xs text-gray-500 hover:text-gray-700">Nein</button>
                            </span>
                          ) : (
                            <>
                              <button onClick={() => startEdit(c)}
                                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-600 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Bearbeiten
                              </button>
                              <button onClick={() => setConfirmId(c.id)}
                                className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Löschen
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Reinigungsfirma informieren</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Wird gesendet an: <span className="font-medium text-gray-700">{cleaningEmail || <span className="text-red-500 italic">nicht konfiguriert</span>}</span>
              </p>
            </div>
            <div className="p-6 space-y-5">
              {changes.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Änderungen dieser Sitzung</p>
                  <div className="space-y-1">
                    {changes.map((ch, i) => (
                      <div key={i} className={`flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg ${ch.type === "added" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        <span className="font-medium">{ch.type === "added" ? "✚ Neu:" : "✖ Entfernt:"}</span>
                        <span className={ch.type === "removed" ? "line-through" : ""}>{formatDate(ch.cleaning.date)}</span>
                        {ch.cleaning.note && <span className="text-xs opacity-70">— {ch.cleaning.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Keine Änderungen in dieser Sitzung. Du kannst den aktuellen Terminplan trotzdem senden.</p>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Bevorstehende Termine (wird mitgeschickt)</p>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Keine Termine geplant.</p>
                ) : (
                  <div className="space-y-1">
                    {upcoming.map((c) => (
                      <div key={c.id} className="text-sm text-gray-700 py-1.5 px-3 bg-gray-50 rounded-lg">
                        {formatDate(c.date)}{c.note && <span className="text-xs text-gray-400 ml-2">— {c.note}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Persönliche Nachricht (optional)</label>
                <textarea value={customText} onChange={(e) => setCustomText(e.target.value)} rows={3}
                  placeholder="z.B. Bitte auch die Fenster putzen. Schlüssel liegt wie gewohnt..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg border border-gray-200 hover:bg-gray-50">
                Abbrechen
              </button>
              <button onClick={handleSend} disabled={sending || !cleaningEmail || sent}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                {sent ? "✓ Gesendet!" : sending ? "Wird gesendet..." : "E-Mail senden"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
