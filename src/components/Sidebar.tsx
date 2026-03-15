"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import { Role } from "@prisma/client";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/kalender", label: "Kalender", icon: "📅" },
  { href: "/buchungen", label: "Meine Buchungen", icon: "🏠" },
  { href: "/anfragen", label: "Anfragen", icon: "📋" },
  { href: "/reinigung", label: "Reinigung", icon: "🧹" },
  { href: "/chat", label: "Chat", icon: "💬" },
  { href: "/benachrichtigungen", label: "Benachrichtigungen", icon: "🔔" },
  { href: "/einstellungen", label: "Einstellungen", icon: "⚙️" },
];

const adminItems = [
  { href: "/admin/zuweisung", label: "Tage zuweisen", icon: "📝" },
  { href: "/admin/uebersicht", label: "Alle Buchungen", icon: "📊" },
];

export default function Sidebar({ session }: { session: Session }) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sidebar bei Seitenwechsel schliessen
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const fetchUnread = async () => {
      const res = await fetch("/api/notifications/unread");
      if (res.ok) {
        const data = await res.json();
        setUnread(data.count);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, []);

  const role = session.user.role;
  const avatarColor =
    role === Role.FAMILY_1 ? "bg-blue-500" :
    role === Role.FAMILY_2 ? "bg-emerald-500" : "bg-violet-500";
  const initials = session.user.name?.slice(0, 2).toUpperCase() ?? "??";

  const sidebarContent = (
    <aside className="w-64 bg-blue-950 text-white flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm tracking-tight">Ferienhaus Flims</span>
          {/* Close button (mobile only) */}
          <button
            className="md:hidden text-white/60 hover:text-white p-1 rounded-lg"
            onClick={() => setMobileOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2.5 bg-white/5 rounded-lg px-3 py-2">
          <div className={`w-6 h-6 ${avatarColor} rounded-md flex items-center justify-center text-[10px] font-bold shrink-0`}>
            {initials}
          </div>
          <span className="text-xs text-white truncate">{session.user.name}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                active
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/70 hover:bg-white/8 hover:text-white"
              }`}
            >
              <span className="w-5 text-center text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
              {item.href === "/benachrichtigungen" && unread > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          );
        })}

        {role === Role.ADMIN && (
          <>
            <div className="pt-5 pb-2 px-3">
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                Admin
              </span>
            </div>
            {adminItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                    active
                      ? "bg-white/15 text-white font-medium"
                      : "text-white/70 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <span className="w-5 text-center text-base leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/5">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/8 hover:text-white transition-all duration-150"
        >
          <span className="w-5 text-center">↩</span>
          <span>Abmelden</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Hamburger Button (nur Mobile) */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 bg-blue-950 text-white p-2.5 rounded-xl shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Menü öffnen"
      >
        <span className="block w-5 h-0.5 bg-white mb-1"></span>
        <span className="block w-5 h-0.5 bg-white mb-1"></span>
        <span className="block w-5 h-0.5 bg-white"></span>
      </button>

      {/* Dunkler Hintergrund (Mobile) */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Mobile (einfahrend von links) */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </div>

      {/* Sidebar Desktop (immer sichtbar) */}
      <div className="hidden md:block h-full">
        {sidebarContent}
      </div>
    </>
  );
}
