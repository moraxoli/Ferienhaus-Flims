import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import BenachrichtigungenClient from "./BenachrichtigungenClient";

export default async function BenachrichtigungenPage() {
  const session = await auth();
  const notifications = await db.notification.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Benachrichtigungen</h1>
      <BenachrichtigungenClient notifications={notifications} />
    </div>
  );
}
