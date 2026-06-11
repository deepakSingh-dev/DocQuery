import { Citation } from "@/lib/types";

const BADGE: Record<string, { bg: string; color: string; label: string }> = {
  text:           { bg: "#1e3a5f", color: "#93c5fd", label: "text" },
  table:          { bg: "#14402a", color: "#86efac", label: "table" },
  image_caption:  { bg: "#3b1f5e", color: "#d8b4fe", label: "image" },
  summary:        { bg: "#3d2a10", color: "#fcd34d", label: "summary" },
};

const DEFAULT_BADGE = { bg: "#27272a", color: "#a1a1aa", label: "unknown" };

export default function CitationCard({ source, page_number, excerpt, modality }: Citation) {
  const badge = BADGE[modality] ?? DEFAULT_BADGE;

  return (
    <div style={{
      background: "#18181b",
      border: "1px solid #27272a",
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ color: "#e4e4e7", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
          {source}
        </span>
        <span style={{ color: "#71717a", fontSize: 11 }}>p.{page_number}</span>
        <span style={{
          background: badge.bg,
          color: badge.color,
          borderRadius: 4,
          padding: "1px 7px",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}>
          {badge.label}
        </span>
      </div>
      <p style={{ color: "#71717a", fontStyle: "italic", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        &ldquo;{excerpt}&rdquo;
      </p>
    </div>
  );
}
