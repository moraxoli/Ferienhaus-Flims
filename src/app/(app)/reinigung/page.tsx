import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import ReinigungClient from "./ReinigungClient";

export default async function ReinigungPage() {
  const session = await auth();
  const isAdmin = session?.user.role === Role.ADMIN;
  const currentUserId = session?.user.id ?? "";

  const [cleanings, cleaningEmailSetting] = await Promise.all([
    db.cleaning.findMany({ include: { booking: true }, orderBy: { date: "asc" } }),
    isAdmin ? db.setting.findUnique({ where: { key: "cleaningEmail" } }) : Promise.resolve(null),
  ]);

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reinigungsservice</h1>
      <ReinigungClient
        cleanings={cleanings}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        cleaningEmail={cleaningEmailSetting?.value ?? ""}
      />
    </div>
  );
}
