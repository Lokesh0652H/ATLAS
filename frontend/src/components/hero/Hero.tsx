"use client";

import React from "react";
import { UploadCloud, Search, ShieldCheck, BarChart3 } from "lucide-react";

export function Hero() {
  const featureBadges = [
    { icon: UploadCloud, label: "Upload", sub: "Your Documents" },
    { icon: Search, label: "Search & Explore", sub: "with AI" },
    { icon: ShieldCheck, label: "Get Evidence", sub: "Based Answers" },
    { icon: BarChart3, label: "Evaluate & Improve", sub: "with Real Metrics" },
  ];

  return (
    <section className="relative pt-4 pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Editorial Headline & Copy */}
        <div className="lg:col-span-8 space-y-6">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
            <span>AI RESEARCH &amp; KNOWLEDGE ENGINE</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.08] text-ink-primary font-normal tracking-tight">
            Turn Your Questions <br />
            Into <span className="italic text-champagne font-normal">Verified</span> Answers
          </h1>

          <p className="text-base sm:text-lg text-ink-secondary max-w-2xl font-light leading-relaxed">
            Atlas helps you research, analyze, and understand your documents with AI — with complete source transparency and verifiable evidence.
          </p>

          {/* 4 Feature Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {featureBadges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-surface/80 border border-border-subtle/80 hover:border-champagne/40 transition-colors shadow-subtle"
                >
                  <div className="w-8 h-8 rounded-lg bg-champagne-soft flex items-center justify-center text-champagne shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-xs font-medium text-ink-primary">{badge.label}</div>
                    <div className="text-[11px] text-ink-muted">{badge.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: 3D Layered Glass Artwork with Compass & Editorial Quote */}
        <div className="lg:col-span-4 relative flex flex-col items-center justify-center">
          <div className="relative w-full aspect-[4/3] max-w-[380px] flex items-center justify-center">
            {/* Ambient Champagne Glow */}
            <div className="absolute w-56 h-56 rounded-full bg-champagne/20 blur-3xl -z-10" />

            {/* Layered Glass/Gold Visual Stack */}
            <div className="relative w-64 h-48">
              {/* Back Card */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-champagne/10 to-champagne/30 border border-champagne/40 transform rotate-6 translate-x-4 translate-y-2 backdrop-blur-sm shadow-card" />
              {/* Middle Card */}
              <div className="absolute inset-0 rounded-2xl bg-surface/90 border border-border-subtle transform rotate-2 translate-x-2 -translate-y-1 backdrop-blur-md shadow-card" />
              {/* Front Card */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-surface to-surface-secondary border border-champagne/30 p-5 flex flex-col justify-between shadow-elevated">
                <div className="flex justify-between items-start">
                  <div className="w-9 h-9 rounded-xl bg-champagne/15 border border-champagne/40 flex items-center justify-center text-champagne">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                    </svg>
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                    VERIFIED RAG
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-1.5 w-3/4 bg-border-subtle rounded-full" />
                  <div className="h-1.5 w-1/2 bg-champagne/40 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Editorial Tagline */}
          <div className="text-right w-full max-w-[340px] mt-2">
            <p className="font-serif italic text-base text-ink-primary leading-tight">
              Better research.
            </p>
            <p className="font-serif italic text-base text-ink-secondary leading-tight">
              Clearer decisions.
            </p>
            <div className="w-12 h-[1px] bg-champagne ml-auto mt-2" />
          </div>
        </div>
      </div>
    </section>
  );
}
