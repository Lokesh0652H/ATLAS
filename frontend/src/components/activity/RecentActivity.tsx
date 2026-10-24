"use client";

import React from "react";
import Link from "next/link";
import { FileText, ChevronRight, ArrowRight } from "lucide-react";
import { DocumentRecord } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

interface RecentActivityProps {
  documents: DocumentRecord[];
  isLoading?: boolean;
}

export function RecentActivity({ documents, isLoading = false }: RecentActivityProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-serif text-ink-primary font-normal tracking-wide">
            Recent Activity
          </h2>
          <div className="w-12 h-[1px] bg-border-subtle" />
        </div>
        <Link
          href="/documents"
          className="text-xs text-ink-secondary hover:text-ink-primary flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5 text-champagne" />
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-4 bg-surface border border-border-subtle rounded-xl animate-pulse space-y-2"
            >
              <div className="h-4 bg-surface-secondary rounded w-2/3" />
              <div className="h-3 bg-surface-secondary rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="p-8 bg-surface border border-border-subtle rounded-xl text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-surface-secondary mx-auto flex items-center justify-center text-ink-muted">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-medium text-ink-primary">No activity yet</h3>
          <p className="text-xs text-ink-secondary max-w-md mx-auto leading-relaxed">
            Your document library is currently empty. Attach or drag research documents in the composer above to begin evidence-grounded research.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {documents.slice(0, 6).map((doc) => {
            const isProcessed = doc.processing_status === "indexed";
            const isProcessing = ["uploaded", "queued", "extracting", "chunking", "embedding"].includes(doc.processing_status);
            const isFailed = doc.processing_status === "failed";

            return (
              <Link
                key={doc.id}
                href={`/documents?id=${doc.id}`}
                className="group p-4 bg-surface border border-border-subtle rounded-xl hover:border-champagne/40 hover:shadow-card transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-surface-secondary flex items-center justify-center text-ink-secondary group-hover:text-champagne transition-colors shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium text-ink-primary truncate">
                      {doc.title || doc.filename}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-ink-muted mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isProcessed
                            ? "bg-status-success"
                            : isProcessing
                            ? "bg-champagne animate-pulse"
                            : "bg-status-error"
                        }`}
                      />
                      <span className="capitalize">{doc.processing_status}</span>
                      {doc.page_count && <span>• {doc.page_count} pages</span>}
                      <span>• {formatRelativeTime(doc.created_at)}</span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-ink-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
