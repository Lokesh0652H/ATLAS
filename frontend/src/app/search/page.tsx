"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Loader2, FileText, ArrowRight, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { SearchResult } from "@/lib/types";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialMode = searchParams.get("mode") || "hybrid";

  const { currentWorkspace } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<"hybrid" | "semantic" | "keyword">(
    (initialMode as any) || "hybrid"
  );
  const [results, setResults] = useState<SearchResult[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || !currentWorkspace) return;

    setIsSearching(true);
    try {
      const res = await api.search(currentWorkspace.id, query.trim(), mode, 15);
      setResults(res.results);
      setLatencyMs(res.latency_ms);
      setHasSearched(true);
    } catch (err: any) {
      alert(`Search error: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialQuery && currentWorkspace) {
      handleSearch();
    }
  }, [currentWorkspace]);

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
          Retrieval Engine
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink-primary font-normal mt-1">
          Search Explorer
        </h1>
        <p className="text-xs sm:text-sm text-ink-secondary mt-1">
          Direct passage retrieval with transparent ranking fusion. Compare BM25 lexical scores, dense vector cosine similarities, and RRF rankings.
        </p>
      </div>

      {/* Search Input Box */}
      <form
        onSubmit={handleSearch}
        className="bg-surface border border-border-subtle rounded-2xl p-4 shadow-card space-y-4"
      >
        <div className="relative">
          <Search className="w-5 h-5 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a research question, concept, or exact keywords..."
            className="w-full pl-12 pr-28 py-3 text-sm sm:text-base bg-transparent border-b border-border-subtle focus:outline-none focus:border-champagne text-ink-primary font-normal placeholder:text-ink-muted"
          />
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-4 py-2 bg-ink-primary text-surface rounded-full text-xs font-medium hover:bg-ink-primary/90 transition-all disabled:opacity-40"
          >
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-champagne" />
            ) : (
              <>
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5 text-champagne" />
              </>
            )}
          </button>
        </div>

        {/* Mode Selector and Latency Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-ink-muted mr-1">Mode:</span>
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

          {latencyMs !== null && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-status-success bg-status-success/10 px-2.5 py-0.5 rounded-full">
              <Zap className="w-3 h-3" />
              <span>{latencyMs} ms</span>
            </div>
          )}
        </div>
      </form>

      {/* Results List */}
      {isSearching ? (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-champagne mx-auto" />
          <p className="text-xs text-ink-muted">Scanning vector index and lexical trees...</p>
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="p-12 bg-surface border border-border-subtle rounded-2xl text-center space-y-2">
          <p className="text-sm font-medium text-ink-primary">No matching passages found</p>
          <p className="text-xs text-ink-secondary max-w-md mx-auto">
            Try broadening your search term or switching to Hybrid retrieval mode.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((res, index) => (
            <div
              key={res.chunk_id}
              className="bg-surface border border-border-subtle hover:border-champagne/40 rounded-xl p-5 shadow-card transition-all space-y-3"
            >
              {/* Result Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle/50 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-champagne-soft text-champagne text-[11px] font-mono font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-ink-primary">
                    <FileText className="w-3.5 h-3.5 text-champagne" />
                    <span>{res.document_title}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono text-ink-muted">
                  {res.page_number && <span>Page {res.page_number}</span>}
                  {res.section_heading && (
                    <span className="text-ink-secondary truncate max-w-[180px]">
                      {res.section_heading}
                    </span>
                  )}
                  <span className="text-champagne font-semibold">
                    Score: {res.score.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Passage Content */}
              <p className="text-xs sm:text-sm text-ink-primary font-normal leading-relaxed whitespace-pre-wrap">
                {res.content}
              </p>

              {/* Detailed Scores Breakdown */}
              <div className="flex items-center gap-4 pt-1 text-[10px] font-mono text-ink-muted">
                {res.keyword_score !== null && res.keyword_score !== undefined && (
                  <span>BM25: {res.keyword_score.toFixed(4)}</span>
                )}
                {res.vector_score !== null && res.vector_score !== undefined && (
                  <span>Cosine: {res.vector_score.toFixed(4)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-xs text-ink-muted">
          <Loader2 className="w-6 h-6 animate-spin text-champagne mx-auto mb-2" />
          Loading Search Explorer...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
