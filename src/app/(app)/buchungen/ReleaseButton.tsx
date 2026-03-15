"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReleaseButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRelease() {
    if (!confirm("Woche wirklich freigeben? Die andere Familie wird benachrichtigt.")) return;
    setLoading(true);
    await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "release" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleRelease}
      disabled={loading}
      className="shrink-0 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
    >
      {loading ? "..." : "Freigeben"}
    </button>
  );
}
