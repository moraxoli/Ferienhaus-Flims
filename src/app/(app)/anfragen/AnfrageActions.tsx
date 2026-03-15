"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AnfrageActions({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleDecision(decision: "APPROVED" | "REJECTED") {
    setLoading(decision === "APPROVED" ? "approve" : "reject");
    setError("");
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, decision, comment: comment || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Fehler beim Speichern. Bitte erneut versuchen.");
        return;
      }
      router.refresh();
    } catch {
      setError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(null);
    }
  }

  // Wenn Kommentar-Bereich offen: nur Bestätigen/Abbrechen anzeigen
  if (showComment) {
    return (
      <div className="flex flex-col gap-2 min-w-[160px]">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Kommentar (optional)"
          rows={2}
          className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
          autoFocus
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => handleDecision("REJECTED")}
            disabled={!!loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
          >
            {loading === "reject" ? "..." : "Ablehnen bestätigen"}
          </button>
          <button
            onClick={() => { setShowComment(false); setComment(""); setError(""); }}
            disabled={!!loading}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5"
          >
            Abbrechen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 min-w-[140px]">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => handleDecision("APPROVED")}
          disabled={!!loading}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-lg"
        >
          {loading === "approve" ? "..." : "Genehmigen"}
        </button>
        <button
          onClick={() => setShowComment(true)}
          disabled={!!loading}
          className="flex-1 bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg"
        >
          Ablehnen
        </button>
      </div>
    </div>
  );
}
