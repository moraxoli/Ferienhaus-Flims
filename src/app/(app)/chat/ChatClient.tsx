"use client";

import { useEffect, useRef, useState } from "react";
import { Session } from "next-auth";
import { Role } from "@prisma/client";
import { roleColor } from "@/lib/utils";

const STORAGE_KEY = "haus-flims-chat-name";

type Message = {
  id: string;
  content: string;
  senderName: string | null;
  createdAt: string;
  author: { name: string; role: Role };
};

export default function ChatClient({
  initialMessages,
  session,
}: {
  initialMessages: Message[];
  session: Session;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [sendError, setSendError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTimestamp = useRef<string>(
    initialMessages.at(-1)?.createdAt || new Date(0).toISOString()
  );

  // Gespeicherten Namen aus localStorage laden
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setSenderName(saved);
  }, []);

  // Namen in localStorage speichern wenn er sich ändert
  function handleNameChange(value: string) {
    setSenderName(value);
    setNameError(false);
    if (value.trim()) localStorage.setItem(STORAGE_KEY, value.trim());
  }

  // Polling every 5 seconds
  useEffect(() => {
    const poll = async () => {
      const res = await fetch(`/api/messages?since=${encodeURIComponent(lastTimestamp.current)}`);
      if (res.ok) {
        const newMsgs: Message[] = await res.json();
        if (newMsgs.length > 0) {
          setMessages((prev) => [...prev, ...newMsgs]);
          lastTimestamp.current = newMsgs.at(-1)!.createdAt;
        }
      }
    };
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSendError("");
    if (!input.trim()) return;
    if (!senderName.trim()) {
      setNameError(true);
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input, senderName: senderName.trim() }),
      });
      if (res.ok) {
        const msg: Message = await res.json();
        setMessages((prev) => [...prev, msg]);
        lastTimestamp.current = msg.createdAt;
        setInput("");
        localStorage.setItem(STORAGE_KEY, senderName.trim());
      } else {
        const data = await res.json().catch(() => ({}));
        setSendError(data.error ?? "Nachricht konnte nicht gesendet werden.");
      }
    } catch {
      setSendError("Verbindungsfehler. Bitte erneut versuchen.");
    }
    setSending(false);
  }

  const myRole = session.user.role;

  return (
    <div className="flex flex-col bg-white rounded-xl shadow overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">Noch keine Nachrichten. Schreib als Erster!</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.author.role === myRole;
          const displayName = msg.senderName
            ? `${msg.senderName} · ${msg.author.name}`
            : msg.author.name;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs lg:max-w-md ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                <span className="text-xs text-gray-500 mb-1 mx-1">{displayName}</span>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? "text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-900 rounded-bl-sm"
                  }`}
                  style={isMe ? { backgroundColor: roleColor(myRole) } : {}}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-gray-400 mt-1 mx-1">
                  {new Date(msg.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 space-y-2">
        {sendError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            ⚠️ {sendError}
          </p>
        )}
        {/* Vorname-Eingabe */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 whitespace-nowrap">Schreibe als:</span>
          <input
            type="text"
            value={senderName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Dein Vorname *"
            maxLength={30}
            className={`flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              nameError ? "border-red-400 bg-red-50" : "border-gray-300"
            }`}
          />
          {nameError && (
            <span className="text-xs text-red-500 whitespace-nowrap">Pflichtfeld</span>
          )}
        </div>

        {/* Nachricht + Senden */}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nachricht schreiben..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-full text-sm font-medium"
          >
            Senden
          </button>
        </div>
      </form>
    </div>
  );
}
