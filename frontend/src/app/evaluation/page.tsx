"use client";

import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  Play,
  Plus,
  Loader2,
  CheckCircle2,
  BarChart3,
  Percent,
  Target,
  FileCheck,
  X,
  Clock,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";

export default function EvaluationPage() {
  const { currentWorkspace } = useAuth();
  const [datasets, setDatasets] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New dataset form state
  const [datasetName, setDatasetName] = useState("");
  const [datasetDesc, setDatasetDesc] = useState("");
  const [queriesInput, setQueriesInput] = useState(
    "What are the core capabilities of quantum computing?\nHow does CRISPR gene editing function?\nExplain the architecture of transformers."
  );

  // Run selection
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [retrievalMode, setRetrievalMode] = useState<"hybrid" | "semantic" | "keyword">("hybrid");

  const fetchData = async () => {
    if (!currentWorkspace) return;
    try {
      const [dsData, runsData] = await Promise.all([
        api.getEvaluationDatasets(currentWorkspace.id),
        api.getEvaluationRuns(currentWorkspace.id),
      ]);
      setDatasets(dsData);
      setRuns(runsData);
      if (dsData.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(dsData[0].id);
      }
      if (runsData.length > 0 && !selectedRun) {
        setSelectedRun(runsData[0]);
      }
    } catch {
      setDatasets([]);
      setRuns([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentWorkspace]);

  const handleCreateDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datasetName.trim() || !currentWorkspace) return;

    const queryList = queriesInput
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    const examples = queryList.map((q) => ({
      query: q,
      expected_answer: null,
      relevant_chunk_ids: [],
    }));

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("atlas_token") : "";
      const res = await fetch("/api/v1/evaluations/datasets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          name: datasetName.trim(),
          description: datasetDesc.trim() || null,
          examples,
        }),
      });

      if (!res.ok) throw new Error("Failed to create dataset");
      const newDs = await res.json();
      setShowCreateModal(false);
      setDatasetName("");
      setDatasetDesc("");
      await fetchData();
      setSelectedDatasetId(newDs.id);
    } catch (err: any) {
      alert(`Error creating dataset: ${err.message}`);
    }
  };

  const handleRunEvaluation = async () => {
    if (!selectedDatasetId || !currentWorkspace) return;

    setIsExecuting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("atlas_token") : "";
      const res = await fetch("/api/v1/evaluations/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          dataset_id: selectedDatasetId,
          retrieval_mode: retrievalMode,
          k: 5,
        }),
      });

      if (!res.ok) throw new Error("Evaluation run failed");
      const completedRun = await res.json();
      setSelectedRun(completedRun);
      await fetchData();
    } catch (err: any) {
      alert(`Evaluation error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const runExamples = selectedRun?.results_json
    ? JSON.parse(selectedRun.results_json)
    : [];

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
            Rigorous Benchmarking
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink-primary font-normal mt-1">
            Evaluation Lab
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1">
            Compute verifiable retrieval metrics (Recall@K, MRR, nDCG) and claim faithfulness against grounded evidence.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-subtle rounded-full text-xs font-medium text-ink-primary hover:border-champagne transition-all shadow-subtle self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-champagne" />
          <span>New Dataset</span>
        </button>
      </div>

      {/* Benchmark Execution Card */}
      <div className="bg-surface border border-border-subtle rounded-2xl p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-ink-primary uppercase tracking-wider font-mono">
              Execute Benchmark Run
            </h3>
            <p className="text-xs text-ink-secondary">
              Select a dataset and retrieval mode to measure pipeline quality.
            </p>
          </div>

          <button
            onClick={handleRunEvaluation}
            disabled={isExecuting || datasets.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-ink-primary text-surface rounded-full text-xs font-medium hover:bg-ink-primary/90 transition-all disabled:opacity-40 shadow-subtle self-start sm:self-auto"
          >
            {isExecuting ? (
              <Loader2 className="w-4 h-4 animate-spin text-champagne" />
            ) : (
              <Play className="w-4 h-4 text-champagne fill-champagne" />
            )}
            <span>Run Benchmark</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-subtle/60">
          <div>
            <label className="text-[11px] font-mono text-ink-muted uppercase block mb-1">
              Dataset
            </label>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="w-full text-xs p-2 bg-surface-secondary/50 border border-border-subtle rounded-lg focus:outline-none focus:border-champagne text-ink-primary"
            >
              {datasets.length === 0 ? (
                <option value="">No datasets available — create one above</option>
              ) : (
                datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.example_count} queries)
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-ink-muted uppercase block mb-1">
              Retrieval Mode
            </label>
            <div className="flex items-center gap-2 pt-0.5">
              {(["hybrid", "semantic", "keyword"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRetrievalMode(m)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full capitalize transition-colors ${
                    retrievalMode === m
                      ? "bg-champagne/15 text-ink-primary border border-champagne/40"
                      : "text-ink-secondary hover:text-ink-primary bg-surface-secondary/50 border border-transparent"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Scorecards */}
      {selectedRun ? (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg text-ink-primary">
                Latest Benchmark Scores
              </h3>
              <div className="text-[11px] font-mono text-ink-muted flex items-center gap-2">
                <span>Mode: {selectedRun.retrieval_mode}</span>
                <span>• {selectedRun.duration_ms} ms</span>
                <span>• {formatRelativeTime(selectedRun.created_at)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Recall@5", val: selectedRun.recall_at_k, icon: Target },
                { label: "Precision@5", val: selectedRun.precision_at_k, icon: Percent },
                { label: "MRR", val: selectedRun.mrr, icon: BarChart3 },
                { label: "nDCG@5", val: selectedRun.ndcg_at_k, icon: Layers },
                { label: "Faithfulness", val: selectedRun.faithfulness_score, icon: FileCheck },
                { label: "Citation Validity", val: selectedRun.citation_validity_score, icon: CheckCircle2 },
              ].map((m, i) => {
                const Icon = m.icon;
                const formatted = m.val !== null && m.val !== undefined ? `${(m.val * 100).toFixed(1)}%` : "N/A";
                return (
                  <div
                    key={i}
                    className="p-4 bg-surface border border-border-subtle rounded-xl shadow-subtle space-y-2"
                  >
                    <div className="flex items-center justify-between text-ink-muted">
                      <span className="text-[10px] uppercase font-mono tracking-wider">
                        {m.label}
                      </span>
                      <Icon className="w-3.5 h-3.5 text-champagne" />
                    </div>
                    <div className="text-xl font-mono font-medium text-ink-primary">
                      {formatted}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-Example Outcomes Table */}
          {runExamples.length > 0 && (
            <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-card">
              <div className="px-6 py-4 border-b border-border-subtle bg-surface-secondary/30">
                <h4 className="text-xs font-semibold text-ink-primary uppercase tracking-wider font-mono">
                  Per-Example Retrieval &amp; Faithfulness Breakdown
                </h4>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-secondary/40 border-b border-border-subtle text-ink-muted uppercase font-mono text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Query</th>
                    <th className="px-6 py-3">Recall@5</th>
                    <th className="px-6 py-3">MRR</th>
                    <th className="px-6 py-3">nDCG@5</th>
                    <th className="px-6 py-3 text-right">Passages Found</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/60">
                  {runExamples.map((ex: any, idx: number) => (
                    <tr key={idx} className="hover:bg-surface-secondary/30 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-ink-primary max-w-sm truncate">
                        {ex.query}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-ink-secondary">
                        {(ex.recall_at_k * 100).toFixed(0)}%
                      </td>
                      <td className="px-6 py-3.5 font-mono text-ink-secondary">
                        {ex.mrr.toFixed(3)}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-ink-secondary">
                        {ex.ndcg_at_k.toFixed(3)}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-right text-champagne font-semibold">
                        {ex.retrieved_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="p-16 bg-surface border border-border-subtle rounded-2xl text-center space-y-3 shadow-subtle">
          <div className="w-12 h-12 rounded-full bg-champagne-soft mx-auto flex items-center justify-center text-champagne">
            <FlaskConical className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg text-ink-primary">No evaluation runs yet</h3>
          <p className="text-xs text-ink-secondary max-w-md mx-auto leading-relaxed">
            Create a benchmark dataset above and trigger an evaluation run to compute genuine retrieval and answer-quality metrics.
          </p>
        </div>
      )}

      {/* Create Dataset Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-ink-primary/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-subtle rounded-2xl max-w-lg w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="font-serif text-lg text-ink-primary">
                Create Benchmark Dataset
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-ink-muted hover:text-ink-primary rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDataset} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-ink-primary block mb-1">
                  Dataset Name
                </label>
                <input
                  type="text"
                  required
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="e.g. Core Research Benchmark v1"
                  className="w-full text-xs p-2.5 bg-surface-secondary/50 border border-border-subtle rounded-lg focus:outline-none focus:border-champagne text-ink-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-ink-primary block mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={datasetDesc}
                  onChange={(e) => setDatasetDesc(e.target.value)}
                  placeholder="Evaluation queries testing quantum & genomic retrieval"
                  className="w-full text-xs p-2.5 bg-surface-secondary/50 border border-border-subtle rounded-lg focus:outline-none focus:border-champagne text-ink-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-ink-primary block mb-1">
                  Test Inquiries (One per line)
                </label>
                <textarea
                  rows={4}
                  required
                  value={queriesInput}
                  onChange={(e) => setQueriesInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-surface-secondary/50 border border-border-subtle rounded-lg focus:outline-none focus:border-champagne text-ink-primary resize-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-ink-secondary hover:text-ink-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-ink-primary text-surface rounded-full text-xs font-medium hover:bg-ink-primary/90 transition-colors"
                >
                  Save Dataset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
