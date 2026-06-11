import CitationCard from "@/components/CitationCard";
import { Message } from "@/lib/types";

export default function MessageBubble({ role, content, citations, isStreaming }: Message) {
  const isUser = role === "user";

  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 16 }}>
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 8, alignItems: isUser ? "flex-end" : "flex-start" }}>
        {/* Role label */}
        <span style={{ fontSize: 11, color: "#52525b", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {isUser ? "You" : "DocQuery"}
        </span>

        {/* Bubble */}
        <div style={{
          background: isUser ? "#1d4ed8" : "#18181b",
          border: isUser ? "none" : "1px solid #27272a",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          padding: "10px 14px",
          fontSize: 14,
          lineHeight: 1.6,
          color: isUser ? "#fff" : "#e4e4e7",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {content}
          {isStreaming && (
            <span className="cursor-blink" style={{
              display: "inline-block",
              width: 2,
              height: 14,
              background: "#a1a1aa",
              marginLeft: 3,
              borderRadius: 1,
              verticalAlign: "middle",
            }} />
          )}
        </div>

        {/* Citations */}
        {!isUser && citations && citations.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
            <span style={{ fontSize: 11, color: "#52525b", letterSpacing: "0.05em" }}>SOURCES</span>
            {citations.map((c, i) => (
              <CitationCard key={i} {...c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
