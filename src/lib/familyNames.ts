import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export type FamilyNames = Record<Role, string>;

export async function getFamilyNames(): Promise<FamilyNames> {
  // Bei mehreren Usern pro Rolle (z.B. Seed + echter Account) gewinnt der zuletzt angelegte
  const [family1, family2] = await Promise.all([
    db.user.findFirst({ where: { role: Role.FAMILY_1 }, orderBy: { createdAt: "desc" } }),
    db.user.findFirst({ where: { role: Role.FAMILY_2 }, orderBy: { createdAt: "desc" } }),
  ]);

  return {
    [Role.ADMIN]: "Administrator",
    [Role.FAMILY_1]: family1?.name ?? "Familie 1",
    [Role.FAMILY_2]: family2?.name ?? "Familie 2",
  };
}
