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

  const appendToken = useCallback((token: string) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") return prev;
      return [...prev.slice(0, -1), { ...last, content: last.content + token }];
    });
  }, []);

  const finalizeCitations = useCallback((answer: string, citations: Citation[]) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") return prev;
      // The stream delivers the model's raw JSON token-by-token; once the final
      // frame arrives, replace the bubble with the cleanly parsed answer.
      return [...prev.slice(0, -1), { ...last, content: answer || last.content, citations, isStreaming: false }];
    });
    setIsTyping(false);
  }, []);

  const sendMessage = useCallback(() => {
    const question = input.trim();
    if (!question || isTyping) return;

    setMessages(prev => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: "", isStreaming: true },
    ]);
    setInput("");
    setIsTyping(true);

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify({ question }));

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "citations") {
          finalizeCitations(parsed.data?.answer ?? "", parsed.data?.citations ?? []);
          ws.close();
          return;
        }
      } catch { /* not JSON — it's a token */ }
      appendToken(event.data);
    };

    ws.onerror = () => {
      appendToken("\n\n[Connection error — is the backend running?]");
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
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      maxWidth: 760,
      margin: "0 auto",
    }}>
      {/* Header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 20px",
        borderBottom: "1px solid #18181b",
        background: "#09090b",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "#fff",
          }}>D</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#fafafa" }}>DocQuery</span>
        </div>
        <Link href="/documents" style={{
          fontSize: 13, color: "#71717a", textDecoration: "none",
          padding: "5px 12px", borderRadius: 6, border: "1px solid #27272a",
          background: "#111113", display: "flex", alignItems: "center", gap: 6,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Documents
        </Link>
      </header>

      {/* Messages */}
      <ChatWindow messages={messages} isTyping={isTyping} />

      {/* Input */}
      <div style={{
        padding: "12px 16px 16px",
        borderTop: "1px solid #18181b",
        background: "#09090b",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask a question about your documents…"
            rows={2}
            disabled={isTyping}
            style={{
              flex: 1,
              resize: "none",
              background: "#111113",
              border: "1px solid #27272a",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 14,
              color: "#fafafa",
              outline: "none",
              fontFamily: "inherit",
              lineHeight: 1.5,
            }}
            onFocus={e => (e.target.style.borderColor = "#3b82f6")}
            onBlur={e => (e.target.style.borderColor = "#27272a")}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            style={{
              padding: "10px 18px",
              background: input.trim() && !isTyping ? "#2563eb" : "#18181b",
              color: input.trim() && !isTyping ? "#fff" : "#52525b",
              border: "1px solid #27272a",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
              transition: "background 0.15s, color 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            Send
          </button>
        </div>
        <p style={{ fontSize: 11, color: "#3f3f46", margin: "6px 0 0 4px" }}>
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
