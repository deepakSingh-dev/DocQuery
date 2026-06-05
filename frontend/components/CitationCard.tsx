import { Citation } from "@/lib/types";

const MODALITY_STYLES: Record<string, string> = {
  text: "bg-blue-100 text-blue-700",
  table: "bg-green-100 text-green-700",
  image_caption: "bg-purple-100 text-purple-700",
  summary: "bg-orange-100 text-orange-700",
};

export default function CitationCard({ source, page_number, excerpt, modality }: Citation) {
  const badgeStyle = MODALITY_STYLES[modality] ?? "bg-gray-100 text-gray-600";

  return (
    <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-gray-800 truncate">{source}</span>
        <span className="text-gray-400 text-xs">p.{page_number}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeStyle}`}>
          {modality.replace("_", " ")}
        </span>
      </div>
      <p className="text-gray-500 italic truncate">&ldquo;{excerpt}&rdquo;</p>
    </div>
  );
}
