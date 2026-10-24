"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { History, Sparkles, Trash2, ArrowRight, Download, Loader2, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ResearchSessionRecord } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

export default function HistoryPage() {
  const { currentWorkspace } = useAuth();
  const [sessions, setSessions] = useState<ResearchSessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    if (!currentWorkspace) return;
    try {
      const data = await api.getSessions(currentWorkspace.id);
      setSessions(data);
    } catch {
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [currentWorkspace]);

  const handleDelete = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this research session?")) return;
    try {
      await api.deleteSession(sessionId);
      await fetchSessions();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
          Memory & Records
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink-primary font-normal mt-1">
          Research History
        </h1>
        <p className="text-xs sm:text-sm text-ink-secondary mt-1">
          View, revisit, and export your previous research sessions. Historical answers remain preserved without silent re-generation.
        </p>
      </div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="p-16 text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-champagne mx-auto" />
          <p className="text-xs text-ink-muted">Loading research records...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-16 bg-surface border border-border-subtle rounded-2xl text-center space-y-3 shadow-subtle">
          <div className="w-12 h-12 rounded-full bg-champagne-soft mx-auto flex items-center justify-center text-champagne">
            <History className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg text-ink-primary">No research sessions yet</h3>
          <p className="text-xs text-ink-secondary max-w-md mx-auto leading-relaxed">
            Every research inquiry you synthesize is automatically preserved here with citations and metadata.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-ink-primary text-surface rounded-full text-xs font-medium hover:bg-ink-primary/90 transition-all shadow-subtle"
            >
              <span>Start New Research</span>
              <ArrowRight className="w-3.5 h-3.5 text-champagne" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-surface border border-border-subtle hover:border-champagne/40 rounded-xl p-5 shadow-card transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-champagne" />
                  <h3 className="text-sm font-medium text-ink-primary truncate">
                    {s.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-ink-muted font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatRelativeTime(s.created_at)}
                  </span>
                  <span>• {s.messages?.length || 0} messages</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={async () => {
                    try {
                      await api.downloadReport(s.id);
                    } catch (err: any) {
                      alert(`Export failed: ${err.message}`);
                    }
                  }}
                  className="p-2 text-ink-secondary hover:text-ink-primary hover:bg-surface-secondary rounded-lg transition-colors cursor-pointer"
                  title="Export Markdown Report"
                >
                  <Download className="w-4 h-4 text-champagne" />
                </button>

                <Link
                  href={`/research?session=${s.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-surface-secondary/70 hover:bg-surface-secondary border border-border-subtle rounded-lg text-xs font-medium text-ink-primary transition-colors"
                >
                  <span>Revisit</span>
                  <ArrowRight className="w-3 h-3 text-champagne" />
                </Link>

                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-2 text-ink-secondary hover:text-status-error hover:bg-status-error/10 rounded-lg transition-colors"
                  title="Delete Session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
