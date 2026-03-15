import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ChatClient from "./ChatClient";

export default async function ChatPage() {
  const session = await auth();
  const rawMessages = await db.message.findMany({
    include: { author: { select: { name: true, role: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const messages = rawMessages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }));

  return (
    <div className="p-6 max-w-3xl flex flex-col h-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Familien-Chat</h1>
      <ChatClient initialMessages={messages} session={session!} />
    </div>
  );
}
