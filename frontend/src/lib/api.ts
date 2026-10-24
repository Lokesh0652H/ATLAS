import { User, Workspace, DocumentRecord, SearchResult, ResearchSessionRecord, SystemStatusData } from "./types";

const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000");

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("atlas_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {}
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // System Health
  async getSystemStatus(): Promise<SystemStatusData> {
    return request<SystemStatusData>("/api/v1/health/system-status");
  },

  // Auth
  async register(email: string, password: string, fullName: string): Promise<{ access_token: string; user: User }> {
    return request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
  },

  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    return request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe(): Promise<User> {
    return request<User>("/api/v1/auth/me");
  },

  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    return request<Workspace[]>("/api/v1/workspaces");
  },

  async createWorkspace(name: string): Promise<Workspace> {
    return request<Workspace>("/api/v1/workspaces", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  // Documents
  async getDocuments(workspaceId: string): Promise<DocumentRecord[]> {
    return request<DocumentRecord[]>(`/api/v1/documents?workspace_id=${workspaceId}`);
  },

  async uploadDocument(workspaceId: string, file: File): Promise<DocumentRecord> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspace_id", workspaceId);

    const token = typeof window !== "undefined" ? localStorage.getItem("atlas_token") : null;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload failed");
    }

    return res.json();
  },

  async deleteDocument(documentId: string): Promise<void> {
    return request<void>(`/api/v1/documents/${documentId}`, {
      method: "DELETE",
    });
  },

  // Search
  async search(workspaceId: string, query: string, mode = "hybrid", limit = 10): Promise<{ query: string; mode: string; latency_ms: number; results: SearchResult[] }> {
    return request(`/api/v1/search?workspace_id=${workspaceId}&q=${encodeURIComponent(query)}&mode=${mode}&limit=${limit}`);
  },

  // Research
  async startResearch(workspaceId: string, question: string, retrievalMode = "hybrid", sourceScope = "workspace"): Promise<ResearchSessionRecord> {
    return request<ResearchSessionRecord>("/api/v1/research", {
      method: "POST",
      body: JSON.stringify({
        workspace_id: workspaceId,
        question,
        retrieval_mode: retrievalMode,
        source_scope: sourceScope,
      }),
    });
  },

  // Sessions & History
  async getSessions(workspaceId: string): Promise<ResearchSessionRecord[]> {
    return request<ResearchSessionRecord[]>(`/api/v1/sessions?workspace_id=${workspaceId}`);
  },

  async getSessionDetail(sessionId: string): Promise<ResearchSessionRecord> {
    return request<ResearchSessionRecord>(`/api/v1/sessions/${sessionId}`);
  },

  async deleteSession(sessionId: string): Promise<void> {
    return request<void>(`/api/v1/sessions/${sessionId}`, {
      method: "DELETE",
    });
  },

  async downloadReport(sessionId: string): Promise<void> {
    const token = typeof window !== "undefined" ? localStorage.getItem("atlas_token") : null;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const url = `${API_BASE_URL}/api/v1/sessions/${sessionId}/export?token=${encodeURIComponent(token || "")}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      throw new Error(`Export failed: ${res.statusText}`);
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `atlas_report_${sessionId.slice(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  },

  // Observability & Telemetry
  async getObservability(): Promise<any> {
    return request("/api/v1/observability");
  },

  // Evaluation
  async getEvaluationDatasets(workspaceId: string): Promise<any[]> {
    return request<any[]>(`/api/v1/evaluations/datasets?workspace_id=${workspaceId}`);
  },

  async getEvaluationRuns(workspaceId: string): Promise<any[]> {
    return request<any[]>(`/api/v1/evaluations/runs?workspace_id=${workspaceId}`);
  },
};
