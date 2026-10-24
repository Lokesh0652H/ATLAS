"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  FileText,
  AlertTriangle,
  Info,
  Download,
  ExternalLink,
  X,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ResearchSessionRecord, ResearchMessageRecord, CitationRecord } from "@/lib/types";

function ResearchContent() {
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("session");

  const { currentWorkspace } = useAuth();
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<"hybrid" | "semantic" | "keyword">("hybrid");
  const [session, setSession] = useState<ResearchSessionRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCitation, setActiveCitation] = useState<CitationRecord | null>(null);

  useEffect(() => {
    if (sessionIdParam) {
      api.getSessionDetail(sessionIdParam).then(setSession).catch(() => {});
    }
  }, [sessionIdParam]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() || !currentWorkspace) return;

    setIsSubmitting(true);
    try {
      const updatedSession = await api.startResearch(
        currentWorkspace.id,
        question.trim(),
        mode,
        "workspace"
      );
      setSession(updatedSession);
      setQuestion("");
    } catch (err: any) {
      alert(`Research error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (!session) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("atlas_token") : "";
    window.open(`/api/v1/sessions/${session.id}/export`, "_blank");
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
            Grounded Intelligence
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink-primary font-normal mt-1">
            Research Workspace
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1">
            Evidence-grounded synthesis with verifiable citation tracing and honest limitation acknowledgment.
          </p>
        </div>

        {session && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-surface border border-border-subtle rounded-full text-xs font-medium text-ink-secondary hover:text-ink-primary hover:border-champagne transition-all shadow-subtle self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-champagne" />
            <span>Export Report (MD)</span>
          </button>
        )}
      </div>

      {/* Interactive Question Composer */}
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border-subtle rounded-2xl p-4 shadow-card space-y-4"
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 text-champagne absolute left-4 top-4" />
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask a complex research question to synthesize across your documents..."
            rows={3}
            className="w-full pl-12 pr-4 pt-3.5 text-sm sm:text-base bg-transparent border-b border-border-subtle focus:outline-none focus:border-champagne text-ink-primary font-normal placeholder:text-ink-muted resize-none leading-relaxed"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-ink-muted mr-1">Retrieval Mode:</span>
            {(["hybrid", "semantic", "keyword"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`text-xs font-medium px-3 py-1 rounded-full capitalize transition-colors ${
                  mode === m
                    ? "bg-champagne/15 text-ink-primary border border-champagne/40"
                    : "text-ink-secondary hover:text-ink-primary bg-surface-secondary/50 border border-transparent"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !question.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-ink-primary text-surface rounded-full text-xs font-medium hover:bg-ink-primary/90 transition-all disabled:opacity-40 shadow-subtle"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-champagne" />
              ) : (
                <>
                  <span>Synthesize</span>
                  <ArrowRight className="w-3.5 h-3.5 text-champagne" />
                </>
              )}
            </button>
            <span className="hidden sm:inline-block text-[11px] text-ink-muted font-mono">
              ⌘ + Enter
            </span>
          </div>
        </div>
      </form>

      {/* Research Thread */}
      {session && session.messages && session.messages.length > 0 ? (
        <div className="space-y-6">
          {session.messages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`p-6 rounded-2xl border transition-all ${
                msg.role === "user"
                  ? "bg-surface-secondary/50 border-border-subtle/80"
                  : "bg-surface border-border-subtle shadow-card"
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-subtle/60">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      msg.role === "user" ? "bg-ink-muted" : "bg-champagne"
                    }`}
                  />
                  <span className="text-xs font-semibold text-ink-primary uppercase tracking-wider font-mono">
                    {msg.role === "user" ? "Inquiry" : "Verified Findings"}
                  </span>
                </div>

                {msg.role === "assistant" && (
                  <div className="flex items-center gap-3 text-[11px] font-mono text-ink-muted">
                    <span className="flex items-center gap-1 text-status-success">
                      <Zap className="w-3 h-3" />
                      {msg.latency_ms} ms
                    </span>
                    <span>Mode: {msg.retrieval_mode}</span>
                  </div>
                )}
              </div>

              {/* Contradiction Banner */}
              {msg.has_contradiction && (
                <div className="mb-4 p-3 bg-status-warning/10 border border-status-warning/30 rounded-xl flex items-start gap-2.5 text-xs text-status-warning">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Contradictory Evidence Detected:</span> Conflicting statements were observed across distinct source passages. Inspect the citations below.
                  </div>
                </div>
              )}

              {/* Insufficient Evidence Banner */}
              {msg.has_insufficient_evidence && (
                <div className="mb-4 p-3 bg-status-info/10 border border-status-info/30 rounded-xl flex items-start gap-2.5 text-xs text-status-info">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Evidence Limitation:</span> The document library contains insufficient passages to fully answer this inquiry.
                  </div>
                </div>
              )}

              {/* Message Content with Inline Citations */}
              <div className="text-sm text-ink-primary font-normal leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>

              {/* Citations Row */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-5 pt-4 border-t border-border-subtle/60">
                  <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2 font-mono">
                    Verifiable Citations ({msg.citations.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.citations.map((c) => (
                      <button
                        key={c.id || c.citation_number}
                        onClick={() => setActiveCitation(c)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-secondary/70 hover:bg-surface-secondary border border-border-subtle rounded-lg text-xs transition-colors group"
                      >
                        <span className="font-mono text-champagne font-semibold">
                          [{c.citation_number}]
                        </span>
                        <span className="text-ink-primary font-medium truncate max-w-[160px]">
                          {c.source_title}
                        </span>
                        {c.page_number && (
                          <span className="text-[10px] text-ink-muted font-mono">
                            p.{c.page_number}
                          </span>
                        )}
                        <CheckCircle2 className="w-3 h-3 text-status-success shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 bg-surface border border-border-subtle rounded-2xl text-center space-y-3 shadow-subtle">
          <div className="w-12 h-12 rounded-full bg-champagne-soft mx-auto flex items-center justify-center text-champagne">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg text-ink-primary">Start Evidence-Grounded Research</h3>
          <p className="text-xs text-ink-secondary max-w-md mx-auto leading-relaxed">
            Type your inquiry above. Atlas will retrieve matching passages, detect potential contradictions, and synthesize answers backed by verifiable provenance.
          </p>
        </div>
      )}

      {/* Citation Inspector Modal */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 bg-ink-primary/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-subtle rounded-2xl max-w-xl w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-start justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-champagne-soft text-champagne text-xs font-mono font-bold flex items-center justify-center">
                  {activeCitation.citation_number}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-ink-primary">
                    {activeCitation.source_title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-ink-muted font-mono">
                    {activeCitation.page_number && (
                      <span>Page {activeCitation.page_number}</span>
                    )}
                    {activeCitation.section_heading && (
                      <span>• {activeCitation.section_heading}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveCitation(null)}
                className="p-1 text-ink-muted hover:text-ink-primary rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-ink-muted uppercase font-mono">
                Source Passage Excerpt
              </div>
              <blockquote className="p-4 bg-surface-secondary/50 border-l-2 border-champagne rounded-r-lg text-xs sm:text-sm text-ink-primary italic font-serif leading-relaxed">
                “{activeCitation.excerpt}”
              </blockquote>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[11px] text-ink-muted">
              <div className="flex items-center gap-1.5 text-status-success">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified in Indexed Document</span>
              </div>
              <button
                onClick={() => setActiveCitation(null)}
                className="px-4 py-1.5 bg-ink-primary text-surface rounded-full text-xs font-medium hover:bg-ink-primary/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-xs text-ink-muted">
          <Loader2 className="w-6 h-6 animate-spin text-champagne mx-auto mb-2" />
          Loading Research Workspace...
        </div>
      }
    >
      <ResearchContent />
    </Suspense>
  );
}
