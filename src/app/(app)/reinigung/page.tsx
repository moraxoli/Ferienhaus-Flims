import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ReinigungClient from "./ReinigungClient";

export default async function ReinigungPage() {
  await auth();
  const cleanings = await db.cleaning.findMany({
    include: { booking: true },
    orderBy: { date: "asc" },
  });

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reinigungsservice</h1>
      <ReinigungClient cleanings={cleanings} />
    </div>
  );
}
