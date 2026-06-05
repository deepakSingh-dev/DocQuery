"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DocumentUploader from "@/components/DocumentUploader";
import { DocumentInfo } from "@/lib/types";

const API_BASE = "http://localhost:8000";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`);
      setDocuments(await res.json());
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const deleteDocument = async (filename: string) => {
    await fetch(`${API_BASE}/documents/${encodeURIComponent(filename)}`, { method: "DELETE" });
    setDeleteTarget(null);
    fetchDocuments();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold text-2xl text-blue-600">Documents</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
          ← Back to Chat
        </Link>
      </div>

      <DocumentUploader onReady={fetchDocuments} />

      <div className="mt-8">
        <h2 className="font-semibold text-gray-700 mb-3">Ingested Documents</h2>

        {loading && <p className="text-gray-400 text-sm">Loading...</p>}

        {!loading && documents.length === 0 && (
          <p className="text-gray-400 text-sm">No documents yet. Upload one above.</p>
        )}

        {documents.length > 0 && (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">Filename</th>
                <th className="py-2 pr-4 font-medium">Chunks</th>
                <th className="py-2 pr-4 font-medium">Modalities</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.filename} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 pr-4 font-medium text-gray-800">{doc.filename}</td>
                  <td className="py-2 pr-4 text-gray-500">{doc.chunk_count}</td>
                  <td className="py-2 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {doc.modalities.map((m) => (
                        <span key={m} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {m}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => setDeleteTarget(doc.filename)}
                      className="text-red-400 hover:text-red-600 text-xs transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl mx-4">
            <h3 className="font-semibold text-gray-800 mb-2">Delete document?</h3>
            <p className="text-gray-500 text-sm mb-4">
              This will remove <strong>{deleteTarget}</strong> and all its indexed chunks. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteDocument(deleteTarget)}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
