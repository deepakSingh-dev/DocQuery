"use client";

import { useCallback, useRef, useState } from "react";

const API_BASE = "http://localhost:8000";

type UploadState = "idle" | "uploading" | "polling" | "ready" | "error";

export default function DocumentUploader({ onReady }: { onReady?: () => void }) {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);

  const uploadFile = useCallback(async (file: File) => {
    setFilename(file.name);
    setState("uploading");
    setProgress(0);
    setError("");

    const form = new FormData();
    form.append("file", file);

    try {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };

      await new Promise<void>((resolve, reject) => {
        xhr.open("POST", `${API_BASE}/documents/upload`);
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText)));
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(form);
      });

      setState("polling");
      await pollForDocument(file.name);
      setState("ready");
      onReady?.();
    } catch (e: unknown) {
      setState("error");
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  }, [onReady]);

  const pollForDocument = async (name: string) => {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const res = await fetch(`${API_BASE}/documents`);
      const docs: { filename: string }[] = await res.json();
      if (docs.some((d) => d.filename === name)) return;
    }
    throw new Error("Ingestion timed out");
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      isDragging.current = false;
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    isDragging.current = true;
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onClick={() => state === "idle" && inputRef.current?.click()}
      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
    >
      <input ref={inputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={onInputChange} />

      {state === "idle" && (
        <div>
          <p className="text-gray-600 font-medium">Drag & drop a PDF or TXT file here</p>
          <p className="text-gray-400 text-sm mt-1">or click to browse</p>
        </div>
      )}

      {state === "uploading" && (
        <div>
          <p className="text-blue-600 font-medium">Uploading {filename}...</p>
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-gray-400 text-sm mt-1">{progress}%</p>
        </div>
      )}

      {state === "polling" && (
        <p className="text-yellow-600 font-medium animate-pulse">Processing {filename}...</p>
      )}

      {state === "ready" && (
        <div className="flex items-center justify-center gap-2">
          <span className="text-green-600 font-medium">✅ {filename} — Ready</span>
          <button
            onClick={(e) => { e.stopPropagation(); setState("idle"); }}
            className="text-gray-400 text-sm underline ml-2"
          >
            Upload another
          </button>
        </div>
      )}

      {state === "error" && (
        <div>
          <p className="text-red-600 font-medium">Upload failed</p>
          <p className="text-gray-400 text-sm mt-1">{error}</p>
          <button
            onClick={(e) => { e.stopPropagation(); setState("idle"); }}
            className="mt-2 text-blue-500 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
