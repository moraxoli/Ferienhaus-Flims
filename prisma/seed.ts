import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const users = [
    { name: "Administrator", email: "admin@ferienhaus.de", password: "admin123", role: Role.ADMIN },
    { name: "Familie Müller", email: "familie1@ferienhaus.de", password: "familie1", role: Role.FAMILY_1 },
    { name: "Familie Schmidt", email: "familie2@ferienhaus.de", password: "familie2", role: Role.FAMILY_2 },
  ];

  for (const user of users) {
    const hashed = await bcrypt.hash(user.password, 12);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, password: hashed },
    });
  }

  console.log("Seed abgeschlossen. Accounts:");
  console.log("  Admin:     admin@ferienhaus.de / admin123");
  console.log("  Familie 1: familie1@ferienhaus.de / familie1");
  console.log("  Familie 2: familie2@ferienhaus.de / familie2");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
