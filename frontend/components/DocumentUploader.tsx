"use client";

import { useCallback, useRef, useState } from "react";

const API = "http://localhost:8000";

type StepStatus = "waiting" | "active" | "done" | "error";

interface Step {
  label: string;
  status: StepStatus;
  detail?: string;
}

const INITIAL_STEPS: Step[] = [
  { label: "Upload file", status: "waiting" },
  { label: "Queue ingestion task", status: "waiting" },
  { label: "Extract text & tables", status: "waiting" },
  { label: "Generate embeddings", status: "waiting" },
  { label: "Store in vector DB", status: "waiting" },
];

type Phase = "idle" | "running" | "done" | "error";

function StepIndicator({ step }: { step: Step }) {
  const iconStyle: React.CSSProperties = {
    width: 20, height: 20, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, flexShrink: 0,
  };

  let icon: React.ReactNode;
  let color: string;

  if (step.status === "done") {
    icon = "✓"; color = "#22c55e";
    Object.assign(iconStyle, { background: "#14402a", color });
  } else if (step.status === "active") {
    icon = <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", display: "block", animation: "pulse 1s ease-in-out infinite" }} />;
    color = "#93c5fd";
    Object.assign(iconStyle, { background: "#1e3a5f", border: "1px solid #3b82f6" });
  } else if (step.status === "error") {
    icon = "✕"; color = "#ef4444";
    Object.assign(iconStyle, { background: "#3f1212", color });
  } else {
    icon = "·"; color = "#52525b";
    Object.assign(iconStyle, { background: "#18181b", color });
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <div style={iconStyle}>{icon}</div>
      <div>
        <span style={{ fontSize: 13, color: step.status === "waiting" ? "#52525b" : "#e4e4e7" }}>
          {step.label}
        </span>
        {step.detail && (
          <p style={{ margin: "2px 0 0", fontSize: 11, color: step.status === "error" ? "#f87171" : "#71717a" }}>
            {step.detail}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DocumentUploader({ onReady }: { onReady?: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [filename, setFilename] = useState("");
  const [chunks, setChunks] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);

  const setStep = (index: number, status: StepStatus, detail?: string) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, status, detail } : s));
  };

  const uploadFile = useCallback(async (file: File) => {
    setFilename(file.name);
    setPhase("running");
    setSteps(INITIAL_STEPS.map((s, i) => ({ ...s, status: i === 0 ? "active" : "waiting" })));
    setChunks(null);

    // Step 0: upload
    const form = new FormData();
    form.append("file", file);
    let taskId = "";

    try {
      const res = await fetch(`${API}/documents/upload`, { method: "POST", body: form });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      taskId = data.task_id;
      setStep(0, "done");
    } catch (e: unknown) {
      setStep(0, "error", e instanceof Error ? e.message : "Upload failed");
      setPhase("error");
      return;
    }

    // Step 1: queued
    setStep(1, "active");
    await new Promise(r => setTimeout(r, 300));
    setStep(1, "done", taskId !== "sync" ? `Task ${taskId.slice(0, 8)}…` : "sync mode");

    // Steps 2–4: poll task status
    const CELERY_STEPS: [number, string][] = [
      [2, "Extract text & tables"],
      [3, "Generate embeddings"],
      [4, "Store in vector DB"],
    ];
    let stepIdx = 2;
    setStep(stepIdx, "active");

    // Simulate step progression while polling real status
    const stepTimer = setInterval(() => {
      if (stepIdx < 4) {
        setStep(stepIdx, "done");
        stepIdx++;
        setStep(stepIdx, "active");
      }
    }, 4000);

    // Poll task status
    let succeeded = false;
    for (let attempt = 0; attempt < 90; attempt++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const res = await fetch(`${API}/documents/task/${taskId}`);
        const data = await res.json();

        if (data.status === "SUCCESS") {
          succeeded = true;
          if (data.result?.chunks_stored) setChunks(data.result.chunks_stored);
          break;
        }
        if (data.status === "FAILURE") {
          clearInterval(stepTimer);
          const errMsg = typeof data.result === "string" ? data.result : "Ingestion failed";
          setStep(stepIdx, "error", errMsg);
          setPhase("error");
          return;
        }
      } catch {
        // network hiccup — keep polling
      }
    }

    clearInterval(stepTimer);

    if (!succeeded) {
      setStep(stepIdx, "error", "Timed out waiting for ingestion");
      setPhase("error");
      return;
    }

    // Mark all remaining steps done
    setSteps(prev => prev.map(s => ({ ...s, status: "done" })));
    setPhase("done");
    onReady?.();
  }, [onReady]);

  const reset = () => {
    setPhase("idle");
    setSteps(INITIAL_STEPS);
    setFilename("");
    setChunks(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    isDragging.current = false;
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  return (
    <div style={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, overflow: "hidden" }}>
      {/* Drop zone */}
      {phase === "idle" && (
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{
            padding: "40px 24px",
            textAlign: "center",
            cursor: "pointer",
            borderBottom: "1px solid #1f1f22",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#18181b")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <input ref={inputRef} type="file" accept=".pdf,.txt" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
          <div style={{ marginBottom: 12, color: "#3b82f6" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto" }}>
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{ color: "#e4e4e7", fontWeight: 500, fontSize: 14, margin: "0 0 4px" }}>
            Drop a PDF or TXT file here
          </p>
          <p style={{ color: "#52525b", fontSize: 12, margin: 0 }}>or click to browse</p>
        </div>
      )}

      {/* Progress steps */}
      {(phase === "running" || phase === "done" || phase === "error") && (
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#e4e4e7" }}>{filename}</p>
              {phase === "done" && chunks !== null && (
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#22c55e" }}>
                  ✓ {chunks} chunks stored and indexed
                </p>
              )}
              {phase === "error" && (
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#f87171" }}>Ingestion failed — see details below</p>
              )}
              {phase === "running" && (
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#71717a" }}>Processing…</p>
              )}
            </div>
            {(phase === "done" || phase === "error") && (
              <button onClick={reset} style={{
                background: "#18181b", border: "1px solid #27272a", borderRadius: 6,
                color: "#a1a1aa", fontSize: 12, padding: "4px 10px", cursor: "pointer",
              }}>
                Upload another
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {steps.map((step, i) => <StepIndicator key={i} step={step} />)}
          </div>
        </div>
      )}
    </div>
  );
}
