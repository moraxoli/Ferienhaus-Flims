import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyAllExcept } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const since = req.nextUrl.searchParams.get("since");
  const messages = await db.message.findMany({
    where: since ? { createdAt: { gt: new Date(since) } } : {},
    include: { author: { select: { name: true, role: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { content, senderName } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Nachricht leer" }, { status: 400 });
  if (!senderName?.trim()) return NextResponse.json({ error: "Bitte Vorname angeben" }, { status: 400 });

  try {
    const message = await db.message.create({
      data: { content: content.trim(), senderName: senderName.trim(), authorId: session.user.id },
      include: { author: { select: { name: true, role: true } } },
    });

    const displayName = `${senderName.trim()} (${session.user.name})`;

    // Andere User benachrichtigen
    const otherUsers = await db.user.findMany({
      where: { id: { not: session.user.id } },
    });
    for (const user of otherUsers) {
      await db.notification.create({
        data: {
          userId: user.id,
          type: "NEW_MESSAGE",
          title: "Neue Chat-Nachricht",
          body: `${displayName}: ${content.substring(0, 80)}${content.length > 80 ? "..." : ""}`,
          linkHref: "/chat",
        },
      });
    }

    return NextResponse.json(message);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("POST /api/messages error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
