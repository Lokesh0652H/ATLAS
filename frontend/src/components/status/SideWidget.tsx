"use client";

import React, { useEffect, useState } from "react";
import { SystemStatusData } from "@/lib/types";
import { api } from "@/lib/api";

export function SideWidget() {
  const [statusData, setStatusData] = useState<SystemStatusData | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api.getSystemStatus();
        setStatusData(data);
      } catch {}
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const components = [
    { label: "API Server", status: statusData?.api_server || "Checking..." },
    { label: "Database", status: statusData?.database || "Checking..." },
    { label: "Redis", status: statusData?.redis || "Configured" },
    { label: "Embedding Provider", status: statusData?.embedding_provider || "Healthy" },
    { label: "LLM Provider", status: statusData?.llm_provider || "Healthy" },
    { label: "Web Search", status: statusData?.web_search || "Healthy" },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Editorial Quote Card with Mountain Art */}
      <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-card">
        <div className="relative h-36 bg-gradient-to-b from-[#D4C8B5] via-[#EAE2D5] to-surface p-4 flex flex-col justify-end">
          {/* Subtle Mountain SVG Silhouettes */}
          <svg
            className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
            viewBox="0 0 400 160"
            preserveAspectRatio="none"
          >
            <path
              d="M0 160L80 90L160 130L260 60L340 110L400 80L400 160Z"
              fill="#947B53"
            />
            <path
              d="M0 160L50 110L130 140L210 95L290 135L370 100L400 120L400 160Z"
              fill="#B49A70"
              opacity="0.6"
            />
          </svg>
        </div>

        <div className="p-5 pt-3 space-y-3">
          <p className="font-serif italic text-base sm:text-lg text-ink-primary leading-snug">
            “The best research is a conversation with the truth.”
          </p>
          <div className="text-[10px] tracking-widest uppercase font-mono text-ink-muted">
            ATLAS
          </div>
        </div>
      </div>

      {/* System Status Card */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <h3 className="text-xs font-semibold text-ink-primary">System Status</h3>
          </div>
          <span className="text-[10px] text-ink-muted font-mono">
            Live
          </span>
        </div>

        <div className="space-y-2.5">
          {components.map((c, i) => {
            const isHealthy = c.status === "Healthy" || c.status === "Configured";
            return (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-ink-secondary">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isHealthy ? "bg-status-success" : "bg-status-warning"
                    }`}
                  />
                  <span>{c.label}</span>
                </div>
                <span
                  className={`text-[11px] font-medium font-mono ${
                    isHealthy ? "text-status-success" : "text-status-warning"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
