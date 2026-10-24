"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  FlaskConical,
  History,
  Activity,
  Settings,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface WorkspaceGridProps {
  documentCount?: number;
  processingCount?: number;
}

export function WorkspaceGrid({ documentCount = 0, processingCount = 0 }: WorkspaceGridProps) {
  const { currentWorkspace } = useAuth();

  const cards = [
    {
      title: "Document Library",
      desc: "Manage and explore your uploaded documents with advanced search and filters.",
      icon: FileText,
      href: "/documents",
      status: (
        <div className="flex items-center gap-3 text-[11px] text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
            {documentCount} {documentCount === 1 ? "document" : "documents"}
          </span>
          {processingCount > 0 && (
            <span className="flex items-center gap-1.5 text-champagne">
              <span className="w-1.5 h-1.5 rounded-full bg-champagne animate-pulse" />
              {processingCount} processing
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Search Explorer",
      desc: "Find relevant information across your documents and web sources.",
      icon: Search,
      href: "/search",
      status: (
        <div className="flex items-center gap-2 text-[11px] text-ink-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
          <span>Semantic • Hybrid • Keyword</span>
        </div>
      ),
    },
    {
      title: "Evaluation Lab",
      desc: "Test and compare retrieval and answer quality with real datasets.",
      icon: FlaskConical,
      href: "/evaluation",
      status: (
        <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-ink-muted" />
          <span>No runs yet</span>
        </div>
      ),
    },
    {
      title: "Research History",
      desc: "View and revisit your past research sessions and answers.",
      icon: History,
      href: "/history",
      status: (
        <div className="flex items-center gap-1.5 text-[11px] text-champagne">
          <span className="w-1.5 h-1.5 rounded-full bg-champagne" />
          <span>Recent activity</span>
        </div>
      ),
    },
    {
      title: "Observability",
      desc: "Monitor system performance, usage and real-time metrics.",
      icon: Activity,
      href: "/observability",
      status: (
        <div className="flex items-center gap-1.5 text-[11px] text-status-success">
          <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
          <span>Live metrics</span>
        </div>
      ),
    },
    {
      title: "Settings",
      desc: "Configure providers, workspace, and account preferences.",
      icon: Settings,
      href: "/settings",
      status: (
        <div className="flex items-center gap-1.5 text-[11px] text-status-success">
          <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
          <span>All systems configured</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-serif text-ink-primary font-normal tracking-wide">
          Your Workspace
        </h2>
        <div className="w-12 h-[1px] bg-border-subtle" />
      </div>

      {/* Grid of 6 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Link
              key={i}
              href={c.href}
              className="group p-5 bg-surface border border-border-subtle rounded-xl hover:border-champagne/40 hover:shadow-card transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-surface-secondary flex items-center justify-center text-ink-secondary group-hover:text-champagne transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-ink-primary group-hover:translate-x-0.5 transition-all" />
              </div>

              <div>
                <h3 className="text-sm font-medium text-ink-primary group-hover:text-champagne-hover transition-colors">
                  {c.title}
                </h3>
                <p className="text-xs text-ink-secondary font-light mt-1 line-clamp-2 leading-relaxed">
                  {c.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-border-subtle/50">
                {c.status}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
