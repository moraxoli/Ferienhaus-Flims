import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  // Aktuellen Namen frisch aus DB laden (damit Namensänderungen sofort wirken)
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });
  if (dbUser) session.user.name = dbUser.name;

  return (
    <SessionProvider session={session}>
      <div
        className="flex h-screen"
        style={{
          backgroundImage: "url('/login-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <Sidebar session={session} />
        <main className="flex-1 overflow-y-auto bg-white/60 backdrop-blur-md pt-14 md:pt-0">{children}</main>
      </div>
    </SessionProvider>
  );
}
