"use client";

import { useState, useMemo } from "react";

export type BookingEntry = {
  family: "FAMILY_1" | "FAMILY_2";
  startDate: string;
  endDate: string;
};

// ---- Easter algorithm (anonymous Gregorian) ----
function easterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const ii = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * ii - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Lokale Zeit → "YYYY-MM-DD" (für Feiertage, die mit new Date(year, month, day) erstellt werden)
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Datum-String um 1 Tag vorwärts (UTC-basiert, kein Timezone-Problem)
function nextDateStr(s: string): string {
  const d = new Date(s + "T12:00:00Z"); // Mittag UTC → sicher vor DST-Grenzen
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

type HolidayInfo = { name: string; type: "public" | "school" };

// ---- Kanton Zürich Schulferien (hardcoded) ----
const SCHOOL_HOLIDAYS: { name: string; start: string; end: string }[] = [
  // Sportferien (Zumikon / Kanton Zürich)
  { name: "Sportferien", start: "2024-02-10", end: "2024-02-24" },
  { name: "Sportferien", start: "2025-02-08", end: "2025-02-22" },
  { name: "Sportferien", start: "2026-02-07", end: "2026-02-21" },
  { name: "Sportferien", start: "2027-02-06", end: "2027-02-20" },
  // Osterferien
  { name: "Osterferien", start: "2024-03-30", end: "2024-04-13" },
  { name: "Osterferien", start: "2025-04-12", end: "2025-04-26" },
  { name: "Osterferien", start: "2026-03-28", end: "2026-04-11" },
  { name: "Osterferien", start: "2027-04-17", end: "2027-05-01" },
  // Sommerferien
  { name: "Sommerferien", start: "2024-07-13", end: "2024-08-17" },
  { name: "Sommerferien", start: "2025-07-12", end: "2025-08-16" },
  { name: "Sommerferien", start: "2026-07-11", end: "2026-08-15" },
  { name: "Sommerferien", start: "2027-07-10", end: "2027-08-14" },
  // Herbstferien
  { name: "Herbstferien", start: "2024-10-05", end: "2024-10-19" },
  { name: "Herbstferien", start: "2025-10-04", end: "2025-10-18" },
  { name: "Herbstferien", start: "2026-10-03", end: "2026-10-17" },
  { name: "Herbstferien", start: "2027-10-02", end: "2027-10-16" },
  // Weihnachtsferien
  { name: "Weihnachtsferien", start: "2024-12-21", end: "2025-01-04" },
  { name: "Weihnachtsferien", start: "2025-12-20", end: "2026-01-03" },
  { name: "Weihnachtsferien", start: "2026-12-19", end: "2027-01-02" },
];

function buildHolidayMap(year: number): Map<string, HolidayInfo[]> {
  const map = new Map<string, HolidayInfo[]>();

  function add(date: Date, info: HolidayInfo) {
    const key = toYMD(date);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(info);
  }

  const easter = easterDate(year);

  // Feiertage Kanton Zürich
  const publicDays: [Date, string][] = [
    [new Date(year, 0, 1), "Neujahr"],
    [new Date(year, 0, 2), "Berchtoldstag"],
    [addDays(easter, -2), "Karfreitag"],
    [easter, "Ostersonntag"],
    [addDays(easter, 1), "Ostermontag"],
    [new Date(year, 4, 1), "Tag der Arbeit"],
    [addDays(easter, 39), "Auffahrt"],
    [addDays(easter, 49), "Pfingstsonntag"],
    [addDays(easter, 50), "Pfingstmontag"],
    [new Date(year, 7, 1), "Nationalfeiertag"],
    [new Date(year, 11, 25), "Weihnachten"],
    [new Date(year, 11, 26), "Stephanstag"],
  ];
  for (const [date, name] of publicDays) {
    add(date, { name, type: "public" });
  }

  // Schulferien
  for (const sh of SCHOOL_HOLIDAYS) {
    const s = new Date(sh.start);
    const e = new Date(sh.end);
    if (s.getFullYear() === year || e.getFullYear() === year) {
      const cur = new Date(s);
      while (cur <= e) {
        add(new Date(cur), { name: sh.name, type: "school" });
        cur.setDate(cur.getDate() + 1);
      }
    }
  }

  return map;
}

// ---- Constants ----
const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const DAY_NAMES = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// ---- Component ----
export default function ZuweisungKalender({
  bookings,
  name1,
  name2,
}: {
  bookings: BookingEntry[];
  name1: string;
  name2: string;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // date -> family map — rein string-basiert, kein UTC/Lokal-Timezone-Problem
  const bookedDays = useMemo(() => {
    const map = new Map<string, "FAMILY_1" | "FAMILY_2" | "BOTH">();
    for (const b of bookings) {
      let cur = b.startDate.slice(0, 10); // "YYYY-MM-DD"
      const endStr = b.endDate.slice(0, 10);
      while (cur <= endStr) {
        const existing = map.get(cur);
        if (existing && existing !== b.family) map.set(cur, "BOTH");
        else map.set(cur, b.family as "FAMILY_1" | "FAMILY_2");
        cur = nextDateStr(cur);
      }
    }
    return map;
  }, [bookings]);

  // holiday map (covers prev/current/next year for Dec–Jan overlap)
  const holidayMap = useMemo(() => {
    const maps = [
      buildHolidayMap(year - 1),
      buildHolidayMap(year),
      buildHolidayMap(year + 1),
    ];
    const merged = new Map<string, HolidayInfo[]>();
    for (const m of maps) {
      for (const [k, v] of m) {
        if (!merged.has(k)) merged.set(k, []);
        for (const h of v) {
          if (!merged.get(k)!.find((x) => x.name === h.name))
            merged.get(k)!.push(h);
        }
      }
    }
    return merged;
  }, [year]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  // Build calendar grid cells (Mon-first)
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: lastDate }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = toYMD(today);

  return (
    <div className="bg-white rounded-xl shadow p-5 select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500 text-xl"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500 text-xl"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 pb-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="bg-white h-10" />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const family = bookedDays.get(dateStr);
          const holidays = holidayMap.get(dateStr) ?? [];
          const hasPublic = holidays.some((h) => h.type === "public");
          const hasSchool = holidays.some((h) => h.type === "school");
          const isToday = dateStr === todayStr;
          const tooltipText = [...new Set(holidays.map((h) => h.name))].join(" · ");

          let bg = "bg-white";
          let numColor = "text-gray-700";
          if (!family && hasSchool) { bg = "bg-amber-50"; }
          if (family === "FAMILY_1") { bg = "bg-blue-100"; numColor = "text-blue-800"; }
          if (family === "FAMILY_2") { bg = "bg-green-100"; numColor = "text-green-800"; }
          if (family === "BOTH") { bg = "bg-purple-100"; numColor = "text-purple-800"; }

          return (
            <div
              key={i}
              title={tooltipText || undefined}
              className={`relative ${bg} h-10 flex flex-col items-center justify-center group`}
            >
              <span
                className={`text-[11px] font-medium leading-none ${numColor} ${
                  isToday
                    ? "w-5 h-5 flex items-center justify-center rounded-full ring-2 ring-blue-500 !text-blue-600 font-bold text-[10px]"
                    : ""
                }`}
              >
                {day}
              </span>

              {/* Holiday dots */}
              {(hasPublic || hasSchool) && (
                <div className="absolute bottom-1 flex gap-px">
                  {hasPublic && <span className="w-1 h-1 rounded-full bg-red-400" />}
                  {hasSchool && <span className="w-1 h-1 rounded-full bg-amber-400" />}
                </div>
              )}

              {/* Tooltip */}
              {tooltipText && (
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-20">
                  <div className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                    {tooltipText}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-200 flex-shrink-0" />
          {name1}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-200 flex-shrink-0" />
          {name2}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
          Feiertag (ZH)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
          Schulferien (ZH)
        </span>
        <span className="flex items-center gap-1.5 col-span-2">
          <span className="w-3 h-3 rounded bg-amber-50 border border-amber-200 flex-shrink-0" />
          Schulferienzeit (nicht gebucht)
        </span>
      </div>
    </div>
  );
}
