"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Search, Upload, Globe, Paperclip, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface ResearchComposerProps {
  onSuccess?: () => void;
}

export function ResearchComposer({ onSuccess }: ResearchComposerProps) {
  const router = useRouter();
  const { currentWorkspace, refreshWorkspaces } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"research" | "search" | "upload" | "web">("research");
  const [retrievalMode, setRetrievalMode] = useState<"hybrid" | "semantic" | "keyword">("hybrid");
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const tabs = [
    { id: "research", label: "Research", icon: Sparkles },
    { id: "search", label: "Search", icon: Search },
    { id: "upload", label: "Upload", icon: Upload },
    { id: "web", label: "Web Search", icon: Globe },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentWorkspace) return;

    setIsUploading(true);
    setUploadFeedback(null);
    try {
      await api.uploadDocument(currentWorkspace.id, file);
      setUploadFeedback(`Uploaded: ${file.name}`);
      await refreshWorkspaces();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim()) return;

    if (activeTab === "search") {
      router.push(`/search?q=${encodeURIComponent(question)}&mode=${retrievalMode}`);
      return;
    }

    if (!currentWorkspace) {
      alert("Please select or wait for a workspace to initialize.");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await api.startResearch(
        currentWorkspace.id,
        question.trim(),
        retrievalMode,
        activeTab === "web" ? "web" : "workspace"
      );
      router.push(`/research?session=${session.id}`);
    } catch (err: any) {
      alert(`Research pipeline error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full bg-surface border border-border-subtle rounded-2xl shadow-card overflow-hidden">
      {/* Top Tabs */}
      <div className="flex items-center gap-1 px-4 pt-3 border-b border-border-subtle bg-surface-secondary/30">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-surface text-ink-primary border-t-2 border-champagne -mb-px shadow-sm"
                  : "text-ink-secondary hover:text-ink-primary hover:bg-surface-secondary/50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-champagne" : "text-ink-muted"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Composer Body */}
      <form onSubmit={handleSubmit} className="p-5">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            activeTab === "web"
              ? "Research a topic across the live web and verify claims..."
              : activeTab === "search"
              ? "Search across document passages by keyword or meaning..."
              : "Ask a question about your documents..."
          }
          rows={3}
          className="w-full bg-transparent text-sm sm:text-base text-ink-primary placeholder:text-ink-muted focus:outline-none resize-none font-normal leading-relaxed"
        />

        {/* Upload feedback badge */}
        {uploadFeedback && (
          <div className="mb-3 inline-flex items-center gap-1.5 text-xs text-status-success bg-status-success/10 px-2.5 py-1 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{uploadFeedback}</span>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Bottom Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border-subtle/80">
          {/* Left: Mode Selection Pills */}
          <div className="flex items-center gap-1.5">
            {(["hybrid", "semantic", "keyword"] as const).map((mode) => {
              const isSelected = retrievalMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setRetrievalMode(mode)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full capitalize transition-all ${
                    isSelected
                      ? "bg-champagne/15 text-ink-primary border border-champagne/40 shadow-sm"
                      : "text-ink-secondary hover:text-ink-primary bg-surface-secondary/50 border border-transparent"
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>

          {/* Right: Attach Files & Start Action */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-ink-primary px-3 py-1.5 rounded-lg hover:bg-surface-secondary/70 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-champagne" />
              ) : (
                <Paperclip className="w-3.5 h-3.5" />
              )}
              <span>Attach files</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !question.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-ink-primary text-surface rounded-full text-xs font-medium hover:bg-ink-primary/90 disabled:opacity-40 disabled:hover:bg-ink-primary transition-all shadow-subtle"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-champagne" />
              ) : (
                <>
                  <span>Start Research</span>
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
    </div>
  );
}
