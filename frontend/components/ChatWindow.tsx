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
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Upload a document and ask a question
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {messages.map((msg, i) => (
        <MessageBubble key={i} {...msg} />
      ))}

      {isTyping && (
        <div className="flex justify-start mb-4">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3">
            <div className="flex gap-1 items-center h-4">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
