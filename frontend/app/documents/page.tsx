"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DocumentUploader from "@/components/DocumentUploader";
import { DocumentInfo } from "@/lib/types";

const API = "http://localhost:8000";

const MODALITY_COLOR: Record<string, { bg: string; color: string }> = {
  text:          { bg: "#1e3a5f", color: "#93c5fd" },
  table:         { bg: "#14402a", color: "#86efac" },
  image_caption: { bg: "#3b1f5e", color: "#d8b4fe" },
  summary:       { bg: "#3d2a10", color: "#fcd34d" },
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(`${API}/documents`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setDocuments(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const deleteDocument = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`${API}/documents/${encodeURIComponent(deleteTarget)}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchDocuments();
    } catch {
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "#fff",
          }}>D</div>
          <span style={{ fontWeight: 700, fontSize: 18, color: "#fafafa" }}>Documents</span>
        </div>
        <Link href="/" style={{
          fontSize: 13, color: "#71717a", textDecoration: "none",
          padding: "5px 12px", borderRadius: 6, border: "1px solid #27272a",
          background: "#111113", display: "flex", alignItems: "center", gap: 6,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Chat
        </Link>
      </div>

      {/* Uploader */}
      <DocumentUploader onReady={fetchDocuments} />

      {/* Documents table */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#71717a", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Indexed Documents
          </h2>
          {documents.length > 0 && (
            <span style={{ fontSize: 12, color: "#52525b" }}>{documents.length} file{documents.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#52525b", fontSize: 13 }}>Loading…</div>
        )}

        {!loading && error && (
          <div style={{
            background: "#3f1212", border: "1px solid #7f1d1d", borderRadius: 8,
            padding: "12px 16px", fontSize: 13, color: "#f87171",
          }}>
            ⚠ {error} — is the backend running at localhost:8000?
          </div>
        )}

        {!loading && !error && documents.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#52525b", fontSize: 13 }}>
            No documents yet. Upload one above.
          </div>
        )}

        {!loading && !error && documents.length > 0 && (
          <div style={{ border: "1px solid #1f1f22", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#111113", borderBottom: "1px solid #1f1f22" }}>
                  {["Filename", "Chunks", "Modalities", ""].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#52525b", fontWeight: 600, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, i) => (
                  <tr key={doc.filename} style={{
                    borderBottom: i < documents.length - 1 ? "1px solid #1a1a1d" : "none",
                    background: "transparent",
                    transition: "background 0.1s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#111113")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px", color: "#e4e4e7", fontWeight: 500, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.filename}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#71717a" }}>{doc.chunk_count}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {doc.modalities.map(m => {
                          const c = MODALITY_COLOR[m] ?? { bg: "#27272a", color: "#a1a1aa" };
                          return (
                            <span key={m} style={{
                              background: c.bg, color: c.color,
                              borderRadius: 4, padding: "2px 7px",
                              fontSize: 10, fontWeight: 600,
                              letterSpacing: "0.05em", textTransform: "uppercase",
                            }}>{m}</span>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => setDeleteTarget(doc.filename)}
                        style={{
                          background: "transparent", border: "none",
                          color: "#52525b", fontSize: 12, cursor: "pointer", padding: "2px 6px",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#52525b")}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
        }}>
          <div style={{
            background: "#111113", border: "1px solid #27272a",
            borderRadius: 12, padding: 24, maxWidth: 380, width: "100%", margin: "0 16px",
          }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, color: "#fafafa" }}>Delete document?</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#71717a", lineHeight: 1.6 }}>
              This will permanently remove <strong style={{ color: "#e4e4e7" }}>{deleteTarget}</strong> and all its indexed chunks. This cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  background: "#18181b", border: "1px solid #27272a", borderRadius: 8,
                  color: "#a1a1aa", fontSize: 13, padding: "7px 14px", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={deleteDocument}
                disabled={deleting}
                style={{
                  background: "#7f1d1d", border: "1px solid #991b1b", borderRadius: 8,
                  color: "#fca5a5", fontSize: 13, fontWeight: 600, padding: "7px 14px",
                  cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
