export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  role: string;
  document_count: number;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  workspace_id: string;
  title: string;
  filename: string;
  file_type: "pdf" | "docx" | "txt" | "md";
  file_size_bytes: number;
  processing_status: "uploaded" | "queued" | "extracting" | "chunking" | "embedding" | "indexed" | "failed";
  page_count: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  chunk_id: string;
  document_id: string;
  document_title: string;
  content: string;
  score: number;
  keyword_score?: number;
  vector_score?: number;
  page_number: number | null;
  section_heading: string | null;
}

export interface CitationRecord {
  id: string;
  citation_number: number;
  source_type: "document" | "web";
  source_title: string;
  source_url: string | null;
  page_number: number | null;
  section_heading: string | null;
  excerpt: string;
  is_verified: boolean;
}

export interface ResearchMessageRecord {
  id: string;
  role: "user" | "assistant";
  content: string;
  retrieval_mode: "hybrid" | "semantic" | "keyword";
  has_insufficient_evidence: boolean;
  has_contradiction: boolean;
  latency_ms: number;
  created_at: string;
  citations: CitationRecord[];
}

export interface ResearchSessionRecord {
  id: string;
  workspace_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ResearchMessageRecord[];
}

export interface SystemStatusData {
  api_server: string;
  database: string;
  database_latency_ms: number;
  redis: string;
  embedding_provider: string;
  embedding_model: string;
  llm_provider: string;
  llm_model: string;
  web_search: string;
  last_updated: string;
}
