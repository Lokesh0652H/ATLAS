"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  FileCode,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { DocumentRecord } from "@/lib/types";
import { formatBytes, formatRelativeTime } from "@/lib/utils";

export default function DocumentsPage() {
  const { currentWorkspace, refreshWorkspaces } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchDocs = async () => {
    if (!currentWorkspace) return;
    try {
      const docs = await api.getDocuments(currentWorkspace.id);
      setDocuments(docs);
    } catch {
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    const interval = setInterval(fetchDocs, 4000);
    return () => clearInterval(interval);
  }, [currentWorkspace]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentWorkspace) return;

    setIsUploading(true);
    try {
      await api.uploadDocument(currentWorkspace.id, file);
      await refreshWorkspaces();
      await fetchDocs();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document and its indexed vectors?")) return;
    try {
      await api.deleteDocument(docId);
      await refreshWorkspaces();
      await fetchDocs();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleInspect = async (docId: string) => {
    setIsLoadingDetail(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("atlas_token") : null;
      const res = await fetch(`/api/v1/documents/${docId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const detail = await res.json();
        setSelectedDoc(detail);
      }
    } catch (err: any) {
      alert(`Failed to load document details: ${err.message}`);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesQuery =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || doc.processing_status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
            Knowledge Vault
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink-primary font-normal mt-1">
            Document Library
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1">
            Manage your uploaded research papers, books, and reports. Every indexed chunk preserves page numbers and section headers.
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2.5 bg-ink-primary text-surface rounded-full text-xs font-medium hover:bg-ink-primary/90 transition-all shadow-subtle disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-champagne" />
            ) : (
              <Upload className="w-4 h-4 text-champagne" />
            )}
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface border border-border-subtle p-3 rounded-xl shadow-subtle">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title or filename..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-surface-secondary/50 border border-border-subtle rounded-lg focus:outline-none focus:border-champagne text-ink-primary"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {["all", "indexed", "chunking", "embedding", "failed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs capitalize transition-colors ${
                statusFilter === st
                  ? "bg-ink-primary text-surface font-medium"
                  : "text-ink-secondary hover:text-ink-primary hover:bg-surface-secondary"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Document List Table */}
      {isLoading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-champagne mx-auto mb-2" />
          <p className="text-xs text-ink-muted">Loading knowledge vault...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-12 bg-surface border border-border-subtle rounded-2xl text-center space-y-3 shadow-subtle">
          <div className="w-12 h-12 rounded-full bg-champagne-soft mx-auto flex items-center justify-center text-champagne">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg text-ink-primary">No documents found</h3>
          <p className="text-xs text-ink-secondary max-w-md mx-auto leading-relaxed">
            {searchQuery
              ? "No documents match your search criteria."
              : "Your document library is empty. Upload a PDF, DOCX, TXT, or Markdown document to begin research."}
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/40 border-b border-border-subtle text-ink-muted uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Document</th>
                <th className="px-6 py-3.5">Format</th>
                <th className="px-6 py-3.5">Size</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Uploaded</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60">
              {filteredDocs.map((doc) => {
                const isIndexed = doc.processing_status === "indexed";
                const isFailed = doc.processing_status === "failed";
                const isProcessing = !isIndexed && !isFailed;

                return (
                  <tr key={doc.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center text-ink-secondary shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-ink-primary truncate max-w-sm">
                            {doc.title}
                          </div>
                          <div className="text-[11px] text-ink-muted truncate font-mono">
                            {doc.filename}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono uppercase text-ink-muted">
                      <span className="px-2 py-0.5 bg-surface-secondary rounded border border-border-subtle text-[10px]">
                        {doc.file_type}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-ink-secondary font-mono">
                      {formatBytes(doc.file_size_bytes)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium capitalize">
                        {isIndexed ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                            <span className="text-status-success">
                              Indexed {doc.page_count ? `(${doc.page_count} pgs)` : ""}
                            </span>
                          </>
                        ) : isProcessing ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-champagne" />
                            <span className="text-champagne font-mono">{doc.processing_status}...</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-status-error" />
                            <span className="text-status-error">Failed</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-ink-muted">
                      {formatRelativeTime(doc.created_at)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleInspect(doc.id)}
                          className="p-1.5 text-ink-secondary hover:text-ink-primary hover:bg-surface-secondary rounded-md transition-colors"
                          title="Inspect Chunks & Provenance"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-ink-secondary hover:text-status-error hover:bg-status-error/10 rounded-md transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Document Chunks Inspector Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-ink-primary/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-subtle rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-elevated overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-secondary/30">
              <div>
                <h3 className="font-serif text-lg text-ink-primary">
                  {selectedDoc.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-ink-muted mt-0.5 font-mono">
                  <span>{selectedDoc.chunks?.length || 0} chunks</span>
                  {selectedDoc.page_count && <span>• {selectedDoc.page_count} pages</span>}
                  <span>• {selectedDoc.file_type.toUpperCase()}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 text-ink-muted hover:text-ink-primary rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedDoc.chunks?.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-muted">
                  No chunks extracted yet or document is still processing.
                </div>
              ) : (
                selectedDoc.chunks?.map((chunk: any) => (
                  <div
                    key={chunk.id}
                    className="p-4 bg-surface-secondary/40 border border-border-subtle rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-ink-muted font-mono border-b border-border-subtle/50 pb-1.5">
                      <span className="font-semibold text-champagne">
                        Chunk #{chunk.chunk_index + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        {chunk.page_number && <span>Page {chunk.page_number}</span>}
                        {chunk.section_heading && (
                          <span className="text-ink-secondary truncate max-w-[200px]">
                            {chunk.section_heading}
                          </span>
                        )}
                        <span>{chunk.token_count} tokens</span>
                      </div>
                    </div>
                    <p className="text-ink-primary leading-relaxed whitespace-pre-wrap font-sans">
                      {chunk.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-border-subtle bg-surface-secondary/20 flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 bg-ink-primary text-surface rounded-full text-xs font-medium hover:bg-ink-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
