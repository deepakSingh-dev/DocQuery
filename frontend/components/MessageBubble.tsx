import CitationCard from "@/components/CitationCard";
import { Message } from "@/lib/types";

export default function MessageBubble({ role, content, citations, isStreaming }: Message) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
          }`}
        >
          {content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse rounded-sm align-middle" />
          )}
        </div>

        {!isUser && citations && citations.length > 0 && (
          <div className="flex flex-col gap-1 w-full">
            {citations.map((c, i) => (
              <CitationCard key={i} {...c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
