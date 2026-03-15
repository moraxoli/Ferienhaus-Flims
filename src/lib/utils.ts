import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Role, Season, BookingStatus } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSeason(date: Date): Season {
  const month = date.getMonth() + 1;
  return month >= 12 || month <= 4 ? Season.WINTER : Season.SUMMER;
}

// Berechnet das Reinigungsdatum:
// → Abreisetag (endDate), ausser wenn dieser auf ein Wochenende fällt,
//   dann nächster Montag. Rein UTC-basiert.
export function cleaningDateFor(endDate: Date): Date {
  const d = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
  const dow = d.getUTCDay(); // 0 = Sonntag, 6 = Samstag
  if (dow === 6) d.setUTCDate(d.getUTCDate() + 2); // Sa → Mo
  if (dow === 0) d.setUTCDate(d.getUTCDate() + 1); // So → Mo
  return d;
}

// Abwärtskompatibilität (intern nicht mehr verwendet)
export function nextMonday(date: Date): Date {
  return cleaningDateFor(date);
}

export function roleLabel(role: Role): string {
  switch (role) {
    case Role.ADMIN: return "Administrator";
    case Role.FAMILY_1: return "Familie Müller";
    case Role.FAMILY_2: return "Familie Schmidt";
  }
}

export function roleColor(role: Role): string {
  switch (role) {
    case Role.ADMIN: return "#6366f1";
    case Role.FAMILY_1: return "#3b82f6";
    case Role.FAMILY_2: return "#22c55e";
  }
}

export function roleColorLight(role: Role): string {
  switch (role) {
    case Role.ADMIN: return "#c7d2fe";    // indigo-200
    case Role.FAMILY_1: return "#bfdbfe"; // blue-200
    case Role.FAMILY_2: return "#bbf7d0"; // green-200
  }
}

export function statusLabel(status: BookingStatus): string {
  switch (status) {
    case BookingStatus.ASSIGNED: return "Zugeteilt";
    case BookingStatus.RELEASED: return "Genehmigt";
    case BookingStatus.REQUESTED: return "Angefragt";
    case BookingStatus.APPROVED: return "Genehmigt";
    case BookingStatus.REJECTED: return "Abgelehnt";
  }
}

export function statusColor(status: BookingStatus): string {
  switch (status) {
    case BookingStatus.ASSIGNED: return "bg-blue-100 text-blue-800";
    case BookingStatus.RELEASED: return "bg-green-100 text-green-800";
    case BookingStatus.REQUESTED: return "bg-yellow-100 text-yellow-800";
    case BookingStatus.APPROVED: return "bg-green-100 text-green-800";
    case BookingStatus.REJECTED: return "bg-red-100 text-red-800";
  }
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function getOppositeFamily(role: Role): Role | null {
  if (role === Role.FAMILY_1) return Role.FAMILY_2;
  if (role === Role.FAMILY_2) return Role.FAMILY_1;
  return null;
}
