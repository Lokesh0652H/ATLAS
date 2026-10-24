"use client";

import React, { useEffect, useState } from "react";
import { Hero } from "@/components/hero/Hero";
import { ResearchComposer } from "@/components/composer/ResearchComposer";
import { WorkspaceGrid } from "@/components/workspace/WorkspaceGrid";
import { SideWidget } from "@/components/status/SideWidget";
import { RecentActivity } from "@/components/activity/RecentActivity";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { DocumentRecord } from "@/lib/types";

export default function HomePage() {
  const { currentWorkspace } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const fetchDocs = async () => {
    if (!currentWorkspace) return;
    setIsLoadingDocs(true);
    try {
      const docs = await api.getDocuments(currentWorkspace.id);
      setDocuments(docs);
    } catch {
      setDocuments([]);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [currentWorkspace]);

  const processingCount = documents.filter((d) =>
    ["uploaded", "queued", "extracting", "chunking", "embedding"].includes(d.processing_status)
  ).length;

  return (
    <div className="space-y-10 pb-16">
      {/* 1. Signature Editorial Hero */}
      <Hero />

      {/* 2. Main Research & Workspace Section with Side Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Composer & Workspace Grid */}
        <div className="lg:col-span-8 space-y-8">
          <ResearchComposer onSuccess={fetchDocs} />
          <WorkspaceGrid
            documentCount={documents.length}
            processingCount={processingCount}
          />
        </div>

        {/* Right Column: Editorial Quote & Live System Status */}
        <div className="lg:col-span-4">
          <SideWidget />
        </div>
      </div>

      {/* 3. Recent Activity Section */}
      <RecentActivity documents={documents} isLoading={isLoadingDocs} />
    </div>
  );
}
