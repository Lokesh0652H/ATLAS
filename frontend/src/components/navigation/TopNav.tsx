"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Sun, ChevronDown, User as UserIcon, LogOut, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function TopNav() {
  const pathname = usePathname();
  const { user, workspaces, currentWorkspace, setCurrentWorkspace, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  const navLinks = [
    { label: "Research", href: "/" },
    { label: "Documents", href: "/documents" },
    { label: "Search", href: "/search" },
    { label: "Evaluation", href: "/evaluation" },
    { label: "Observability", href: "/observability" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-md border-b border-border-subtle">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Atlas Logo & Compass Star */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* 8-Point Compass Star in Champagne */}
            <svg
              className="w-6 h-6 text-champagne transform transition-transform group-hover:rotate-45 duration-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
            <span className="font-serif text-2xl tracking-tight text-ink-primary font-medium">
              Atlas
            </span>
          </Link>

          {/* Workspace Pill Dropdown */}
          {currentWorkspace && (
            <div className="relative">
              <button
                onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                className="flex items-center gap-2 text-xs font-medium text-ink-secondary bg-surface-secondary/70 hover:bg-surface-secondary px-2.5 py-1 rounded-full border border-border-subtle transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-champagne" />
                <span className="max-w-[140px] truncate">{currentWorkspace.name}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {workspaceMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-surface border border-border-subtle rounded-lg shadow-card py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-medium text-ink-muted uppercase tracking-wider">
                    Workspaces
                  </div>
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setCurrentWorkspace(ws);
                        setWorkspaceMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-surface-secondary transition-colors"
                    >
                      <span className="truncate">{ws.name}</span>
                      {ws.id === currentWorkspace.id && <Check className="w-3.5 h-3.5 text-champagne" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Horizontal Navigation Links (NO SIDEBAR) */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-[13.5px] font-normal transition-colors py-1 ${
                  isActive ? "text-ink-primary font-medium" : "text-ink-secondary hover:text-ink-primary"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-champagne rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions & User Avatar */}
        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="p-2 text-ink-secondary hover:text-ink-primary hover:bg-surface-secondary/60 rounded-full transition-colors"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </Link>

          <button
            className="p-2 text-ink-secondary hover:text-ink-primary hover:bg-surface-secondary/60 rounded-full transition-colors"
            title="Light Theme Active"
          >
            <Sun className="w-4 h-4 text-champagne" />
          </button>

          {/* User Profile Pill */}
          <div className="relative ml-1">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-surface-secondary/70 transition-colors border border-transparent hover:border-border-subtle"
            >
              <div className="w-7 h-7 rounded-full bg-champagne/20 border border-champagne/40 flex items-center justify-center text-ink-primary text-xs font-medium">
                {user ? user.full_name.charAt(0).toUpperCase() : "L"}
              </div>
              <span className="text-[13px] font-medium text-ink-primary hidden sm:inline-block">
                {user ? user.full_name : "Lokesh Khodke"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-surface border border-border-subtle rounded-lg shadow-elevated py-1.5 z-50">
                <div className="px-3.5 py-2 border-b border-border-subtle">
                  <div className="text-xs font-semibold text-ink-primary">{user?.full_name || "Lokesh Khodke"}</div>
                  <div className="text-[11px] text-ink-muted truncate">{user?.email || "lokesh@atlas.internal"}</div>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 hover:bg-surface-secondary transition-colors text-ink-primary"
                >
                  <UserIcon className="w-3.5 h-3.5 text-ink-muted" />
                  Settings & Providers
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 hover:bg-surface-secondary transition-colors text-status-error border-t border-border-subtle"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
