"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "@/components/MessageBubble";
import { Message } from "@/lib/types";

interface ChatWindowProps {
  messages: Message[];
  isTyping?: boolean;
}

export default function ChatWindow({ messages, isTyping }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (messages.length === 0 && !isTyping) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        color: "#52525b",
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p style={{ fontSize: 14, margin: 0 }}>Upload a document and ask a question</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
      {messages.map((msg, i) => (
        <MessageBubble key={i} {...msg} />
      ))}

      {isTyping && (
        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
          <div style={{
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "16px 16px 16px 4px",
            padding: "12px 16px",
            display: "flex",
            gap: 5,
            alignItems: "center",
          }}>
            <span className="dot-1" style={{ width: 6, height: 6, background: "#52525b", borderRadius: "50%", display: "inline-block" }} />
            <span className="dot-2" style={{ width: 6, height: 6, background: "#52525b", borderRadius: "50%", display: "inline-block" }} />
            <span className="dot-3" style={{ width: 6, height: 6, background: "#52525b", borderRadius: "50%", display: "inline-block" }} />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
