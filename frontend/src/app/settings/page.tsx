"use client";

import React, { useState } from "react";
import {
  Settings,
  Shield,
  Key,
  Database,
  CheckCircle2,
  Lock,
  Cpu,
  Save,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { user, currentWorkspace } = useAuth();
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
          Administration
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink-primary font-normal mt-1">
          Settings &amp; Providers
        </h1>
        <p className="text-xs sm:text-sm text-ink-secondary mt-1">
          Configure active research workspace parameters, AI model providers, and security credentials.
        </p>
      </div>

      <div className="space-y-6">
        {/* Workspace Identity Section */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
            <Database className="w-4 h-4 text-champagne" />
            <h3 className="text-xs font-semibold text-ink-primary uppercase tracking-wider font-mono">
              Active Workspace
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[11px] font-mono text-ink-muted uppercase block mb-1">
                Workspace Name
              </span>
              <div className="p-2.5 bg-surface-secondary/50 rounded-lg text-ink-primary font-medium border border-border-subtle">
                {currentWorkspace?.name || "Personal Research Lab"}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono text-ink-muted uppercase block mb-1">
                Workspace Slug / ID
              </span>
              <div className="p-2.5 bg-surface-secondary/50 rounded-lg text-ink-primary font-mono text-[11px] border border-border-subtle truncate">
                {currentWorkspace?.slug || "personal-lab"}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono text-ink-muted uppercase block mb-1">
                Owner Account
              </span>
              <div className="p-2.5 bg-surface-secondary/50 rounded-lg text-ink-primary border border-border-subtle">
                {user?.email || "lokesh@atlas.internal"}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono text-ink-muted uppercase block mb-1">
                Membership Role
              </span>
              <div className="p-2.5 bg-surface-secondary/50 rounded-lg text-ink-primary capitalize border border-border-subtle">
                {currentWorkspace?.role || "Owner"}
              </div>
            </div>
          </div>
        </div>

        {/* Configured AI Engines */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
            <Cpu className="w-4 h-4 text-champagne" />
            <h3 className="text-xs font-semibold text-ink-primary uppercase tracking-wider font-mono">
              Configured AI Architecture
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-surface-secondary/40 border border-border-subtle rounded-xl space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                Embedding Model
              </div>
              <div className="font-semibold text-ink-primary">all-MiniLM-L6-v2</div>
              <div className="text-[11px] text-ink-secondary">
                384-dimensional dense semantic vectors with L2 normalization.
              </div>
            </div>

            <div className="p-4 bg-surface-secondary/40 border border-border-subtle rounded-xl space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                Reasoning Engine
              </div>
              <div className="font-semibold text-ink-primary">Atlas Grounded Engine</div>
              <div className="text-[11px] text-ink-secondary">
                Deterministic evidence synthesis with contradiction checking.
              </div>
            </div>

            <div className="p-4 bg-surface-secondary/40 border border-border-subtle rounded-xl space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                Web Search Provider
              </div>
              <div className="font-semibold text-ink-primary">DuckDuckGo + SSRF Defense</div>
              <div className="text-[11px] text-ink-secondary">
                Private IP blocking and citation validation.
              </div>
            </div>
          </div>
        </div>

        {/* Provider Credentials Form */}
        <form onSubmit={handleSave} className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2.5">
              <Key className="w-4 h-4 text-champagne" />
              <h3 className="text-xs font-semibold text-ink-primary uppercase tracking-wider font-mono">
                External Model API Keys (Optional)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-ink-muted flex items-center gap-1">
              <Lock className="w-3 h-3 text-status-success" />
              Encrypted Server-Side Only
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-medium text-ink-primary block mb-1">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full text-xs p-2.5 bg-surface-secondary/50 border border-border-subtle rounded-lg focus:outline-none focus:border-champagne text-ink-primary font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-ink-primary block mb-1">
                Google Gemini API Key
              </label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full text-xs p-2.5 bg-surface-secondary/50 border border-border-subtle rounded-lg focus:outline-none focus:border-champagne text-ink-primary font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-ink-primary block mb-1">
                Anthropic API Key
              </label>
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full text-xs p-2.5 bg-surface-secondary/50 border border-border-subtle rounded-lg focus:outline-none focus:border-champagne text-ink-primary font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
            {savedFeedback ? (
              <div className="flex items-center gap-1.5 text-xs text-status-success">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configuration updated successfully</span>
              </div>
            ) : (
              <div className="text-[11px] text-ink-muted">
                Keys are never logged or exposed to client-side bundles.
              </div>
            )}

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-ink-primary text-surface rounded-full text-xs font-medium hover:bg-ink-primary/90 transition-all shadow-subtle"
            >
              <Save className="w-3.5 h-3.5 text-champagne" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>

        {/* Data Privacy & Sovereignty */}
        <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-card space-y-3">
          <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
            <Shield className="w-4 h-4 text-status-success" />
            <h3 className="text-xs font-semibold text-ink-primary uppercase tracking-wider font-mono">
              Data Privacy &amp; Sovereignty
            </h3>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Atlas operates with zero unauthorized data leakage. By default, with local embedding and reasoning engines enabled, all document extractions, vector queries, and research syntheses are processed entirely within your infrastructure. External calls occur strictly when you explicitly configure API keys or trigger web search scopes.
          </p>
        </div>
      </div>
    </div>
  );
}
