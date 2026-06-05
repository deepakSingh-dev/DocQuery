export interface Citation {
  source: string;
  page_number: number;
  excerpt: string;
  modality: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
}

export interface DocumentInfo {
  filename: string;
  chunk_count: number;
  modalities: string[];
}
