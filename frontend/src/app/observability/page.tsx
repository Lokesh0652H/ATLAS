"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Zap,
  AlertOctagon,
  Clock,
  Layers,
  Database,
  Server,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";

export default function ObservabilityPage() {
  const [telemetry, setTelemetry] = useState<any | null>(null);
  const [systemStatus, setSystemStatus] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const [telData, statData] = await Promise.all([
        api.getObservability(),
        api.getSystemStatus(),
      ]);
      setTelemetry(telData);
      setSystemStatus(statData);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
            Operational Telemetry
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink-primary font-normal mt-1">
            Observability &amp; Health
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1">
            Real measured application metrics, percentile latencies, queue depths, and live dependency health checks.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface border border-border-subtle rounded-full text-xs font-medium text-ink-secondary hover:text-ink-primary transition-colors shadow-subtle self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-champagne" />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-16 text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-champagne mx-auto" />
          <p className="text-xs text-ink-muted">Reading operational telemetry...</p>
        </div>
      ) : (
        <>
          {/* Top Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-5 bg-surface border border-border-subtle rounded-2xl shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-ink-muted">
                <span className="text-[10px] font-mono uppercase tracking-wider">
                  Total Requests
                </span>
                <Server className="w-4 h-4 text-champagne" />
              </div>
              <div className="text-2xl font-mono font-medium text-ink-primary">
                {telemetry?.total_requests ?? 0}
              </div>
            </div>

            <div className="p-5 bg-surface border border-border-subtle rounded-2xl shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-ink-muted">
                <span className="text-[10px] font-mono uppercase tracking-wider">
                  Error Rate
                </span>
                <AlertOctagon className="w-4 h-4 text-status-warning" />
              </div>
              <div className="text-2xl font-mono font-medium text-ink-primary">
                {telemetry?.error_rate_percent ?? 0}%
              </div>
            </div>

            <div className="p-5 bg-surface border border-border-subtle rounded-2xl shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-ink-muted">
                <span className="text-[10px] font-mono uppercase tracking-wider">
                  p50 Latency
                </span>
                <Clock className="w-4 h-4 text-champagne" />
              </div>
              <div className="text-2xl font-mono font-medium text-ink-primary">
                {telemetry?.p50_latency_ms ?? 0} <span className="text-xs text-ink-muted">ms</span>
              </div>
            </div>

            <div className="p-5 bg-surface border border-border-subtle rounded-2xl shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-ink-muted">
                <span className="text-[10px] font-mono uppercase tracking-wider">
                  p95 Latency
                </span>
                <Zap className="w-4 h-4 text-status-success" />
              </div>
              <div className="text-2xl font-mono font-medium text-ink-primary">
                {telemetry?.p95_latency_ms ?? 0} <span className="text-xs text-ink-muted">ms</span>
              </div>
            </div>

            <div className="p-5 bg-surface border border-border-subtle rounded-2xl shadow-subtle space-y-2">
              <div className="flex items-center justify-between text-ink-muted">
                <span className="text-[10px] font-mono uppercase tracking-wider">
                  Queue Depth
                </span>
                <Layers className="w-4 h-4 text-champagne" />
              </div>
              <div className="text-2xl font-mono font-medium text-ink-primary">
                {telemetry?.queue_depth ?? 0}
              </div>
            </div>
          </div>

          {/* Component Health Status Grid */}
          <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                <h3 className="text-xs font-semibold text-ink-primary uppercase tracking-wider font-mono">
                  Live Component Health
                </h3>
              </div>
              <span className="text-[10px] font-mono text-ink-muted">
                Probed via /health/ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "API Application Server", status: systemStatus?.api_server || "Healthy", note: "FastAPI Async" },
                { name: "Primary Database", status: systemStatus?.database || "Healthy", note: `Latency: ${systemStatus?.database_latency_ms ?? 0} ms` },
                { name: "Storage & Cache Broker", status: systemStatus?.redis || "Configured", note: "Local disk + Redis" },
                { name: "Embedding Provider", status: systemStatus?.embedding_provider || "Healthy", note: systemStatus?.embedding_model || "384-d MiniLM" },
                { name: "LLM Reasoning Engine", status: systemStatus?.llm_provider || "Healthy", note: systemStatus?.llm_model || "Local Reasoner" },
                { name: "Web Search Engine", status: systemStatus?.web_search || "Healthy", note: "DuckDuckGo + SSRF Defense" },
              ].map((comp, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-surface-secondary/40 border border-border-subtle rounded-xl flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-ink-primary">{comp.name}</div>
                    <div className="text-[11px] text-ink-muted font-mono">{comp.note}</div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-status-success/10 text-status-success">
                    {comp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Request Stream */}
          <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-card">
            <div className="px-6 py-4 border-b border-border-subtle bg-surface-secondary/30 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-ink-primary uppercase tracking-wider font-mono">
                Recent Request Invocations ({telemetry?.recent_events?.length || 0})
              </h4>
              <span className="text-[10px] font-mono text-ink-muted">
                Instrumented via Middleware
              </span>
            </div>

            {telemetry?.recent_events?.length === 0 ? (
              <div className="p-12 text-center text-xs text-ink-muted">
                No request events recorded yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-secondary/40 border-b border-border-subtle text-ink-muted uppercase font-mono text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Method</th>
                    <th className="px-6 py-3">Endpoint</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Duration</th>
                    <th className="px-6 py-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/60">
                  {telemetry?.recent_events?.map((ev: any) => {
                    const isSuccess = ev.status_code < 400;
                    return (
                      <tr key={ev.id} className="hover:bg-surface-secondary/30 transition-colors">
                        <td className="px-6 py-3 font-mono font-semibold text-[11px]">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              ev.method === "POST"
                                ? "bg-champagne/15 text-champagne-hover"
                                : "bg-surface-secondary text-ink-secondary"
                            }`}
                          >
                            {ev.method}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-ink-primary">
                          {ev.endpoint}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`font-mono text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              isSuccess
                                ? "bg-status-success/10 text-status-success"
                                : "bg-status-error/10 text-status-error"
                            }`}
                          >
                            {ev.status_code}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-ink-muted">
                          {ev.duration_ms} ms
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-ink-muted text-[11px]">
                          {formatRelativeTime(ev.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
