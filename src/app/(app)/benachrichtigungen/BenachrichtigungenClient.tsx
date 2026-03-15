"use client";

import { Notification } from "@prisma/client";
import { useEffect } from "react";
import Link from "next/link";

const typeIcon: Record<string, string> = {
  BOOKING_ASSIGNED: "📅",
  WEEK_RELEASED: "🔓",
  REQUEST_PENDING: "⏳",
  REQUEST_APPROVED: "✅",
  REQUEST_REJECTED: "❌",
  NEW_MESSAGE: "💬",
  CLEANING_SCHEDULED: "🧹",
};

const typeStatusBadge: Record<string, { label: string; className: string } | null> = {
  REQUEST_APPROVED: { label: "Genehmigt", className: "bg-green-100 text-green-800 border border-green-200" },
  REQUEST_REJECTED: { label: "Abgelehnt", className: "bg-red-100 text-red-800 border border-red-200" },
  REQUEST_PENDING: { label: "Ausstehend", className: "bg-yellow-100 text-yellow-800 border border-yellow-200" },
  BOOKING_ASSIGNED: { label: "Zugeteilt", className: "bg-blue-100 text-blue-800 border border-blue-200" },
  WEEK_RELEASED: { label: "Freigegeben", className: "bg-gray-100 text-gray-700 border border-gray-200" },
  NEW_MESSAGE: null,
  CLEANING_SCHEDULED: null,
};

export default function BenachrichtigungenClient({ notifications }: { notifications: Notification[] }) {
  // Alle als gelesen markieren beim Laden
  useEffect(() => {
    fetch("/api/notifications", { method: "PATCH" });
  }, []);

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
        Keine Benachrichtigungen vorhanden.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`bg-white rounded-xl shadow p-4 flex gap-4 ${!n.read ? "border-l-4 border-blue-500" : ""}`}
        >
          <span className="text-xl">{typeIcon[n.type] || "🔔"}</span>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
                {typeStatusBadge[n.type] && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeStatusBadge[n.type]!.className}`}>
                    {typeStatusBadge[n.type]!.label}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {new Date(n.createdAt).toLocaleDateString("de-DE", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>
            {n.linkHref && (
              <Link href={n.linkHref} className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                Details anzeigen →
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
