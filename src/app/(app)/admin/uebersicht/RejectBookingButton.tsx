"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RejectBookingButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  async function handleReject() {
    setLoading(true);
    await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    });
    setLoading(false);
    setConfirming(false);
    router.refresh();
  }

  if (loading) {
    return <span className="text-xs text-gray-400">Wird abgelehnt…</span>;
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Ablehnen?</span>
        <button onClick={handleReject} className="text-xs font-semibold text-orange-600 hover:text-orange-800">
          Ja
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-gray-500 hover:text-gray-700">
          Nein
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-orange-500 hover:text-orange-700 transition-colors"
    >
      Ablehnen
    </button>
  );
}
