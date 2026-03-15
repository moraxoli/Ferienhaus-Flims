import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getFamilyNames } from "@/lib/familyNames";
import EinstellungenClient from "./EinstellungenClient";
import FamilienNamenClient from "./FamilienNamenClient";
import PasswortResetClient from "./PasswortResetClient";
import ReinigungsEmailClient from "./ReinigungsEmailClient";

export default async function EinstellungenPage() {
  const session = await auth();
  const isAdmin = session!.user.role === Role.ADMIN;

  const [familyNames, familyUsers, cleaningEmailSetting] = await Promise.all([
    isAdmin ? getFamilyNames() : Promise.resolve(null),
    isAdmin
      ? db.user.findMany({
          where: { role: { in: [Role.FAMILY_1, Role.FAMILY_2] } },
          select: { id: true, name: true, email: true, plainPassword: true },
          orderBy: { role: "asc" },
        })
      : Promise.resolve([]),
    isAdmin
      ? db.setting.findUnique({ where: { key: "cleaningEmail" } })
      : Promise.resolve(null),
  ]);

  return (
    <div className="p-6 max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Konto-Einstellungen</h1>
      <EinstellungenClient
        currentName={session!.user.name}
        currentEmail={session!.user.email}
      />
      {isAdmin && familyNames && (
        <FamilienNamenClient
          initialName1={familyNames[Role.FAMILY_1]}
          initialName2={familyNames[Role.FAMILY_2]}
        />
      )}
      {isAdmin && (
        <ReinigungsEmailClient initialEmail={cleaningEmailSetting?.value ?? ""} />
      )}
      {isAdmin && familyUsers.length > 0 && (
        <PasswortResetClient users={familyUsers} />
      )}
    </div>
  );
}
