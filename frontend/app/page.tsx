"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import ChatWindow from "@/components/ChatWindow";
import { Citation, Message } from "@/lib/types";

const WS_URL = "ws://localhost:8000/chat/stream";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const appendToken = useCallback((token: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") return prev;
      return [...prev.slice(0, -1), { ...last, content: last.content + token }];
    });
  }, []);

  const finalizeCitations = useCallback((citations: Citation[]) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") return prev;
      return [...prev.slice(0, -1), { ...last, citations, isStreaming: false }];
    });
  }, []);

  const sendMessage = useCallback(() => {
    const question = input.trim();
    if (!question || isTyping) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setMessages((prev) => [...prev, { role: "assistant", content: "", isStreaming: true }]);
    setInput("");
    setIsTyping(true);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify({ question }));

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "citations") {
          finalizeCitations(parsed.data.citations ?? []);
          setIsTyping(false);
          ws.close();
        }
      } catch {
        appendToken(event.data);
      }
    };

    ws.onerror = () => {
      appendToken("\n[Connection error]");
      setIsTyping(false);
    };

    ws.onclose = () => setIsTyping(false);
  }, [input, isTyping, appendToken, finalizeCitations]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <h1 className="font-bold text-lg text-blue-600">DocQuery</h1>
        <Link href="/documents" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
          Manage Documents →
        </Link>
      </header>

      <ChatWindow messages={messages} isTyping={isTyping} />

      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask a question about your documents..."
            rows={2}
            className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  );
}
