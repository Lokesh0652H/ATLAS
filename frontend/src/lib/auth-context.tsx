"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Workspace } from "./types";
import { api } from "./api";

interface AuthContextType {
  user: User | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  setCurrentWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = async () => {
    setIsLoading(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("atlas_token") : null;
    if (!token) {
      // Auto-register an initial research scientist session if completely fresh
      try {
        const autoReg = await api.register("lokesh@atlas.internal", "AtlasPassword2026!", "Lokesh Khodke");
        localStorage.setItem("atlas_token", autoReg.access_token);
        setUser(autoReg.user);
        const wsList = await api.getWorkspaces();
        setWorkspaces(wsList);
        if (wsList.length > 0) setCurrentWorkspace(wsList[0]);
      } catch {
        // Fallback login if already registered
        try {
          const autoLogin = await api.login("lokesh@atlas.internal", "AtlasPassword2026!");
          localStorage.setItem("atlas_token", autoLogin.access_token);
          setUser(autoLogin.user);
          const wsList = await api.getWorkspaces();
          setWorkspaces(wsList);
          if (wsList.length > 0) setCurrentWorkspace(wsList[0]);
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
      return;
    }

    try {
      const me = await api.getMe();
      setUser(me);
      const wsList = await api.getWorkspaces();
      setWorkspaces(wsList);
      if (wsList.length > 0) {
        setCurrentWorkspace(wsList[0]);
      }
    } catch {
      localStorage.removeItem("atlas_token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem("atlas_token", res.access_token);
    setUser(res.user);
    const wsList = await api.getWorkspaces();
    setWorkspaces(wsList);
    if (wsList.length > 0) setCurrentWorkspace(wsList[0]);
  };

  const register = async (email: string, password: string, fullName: string) => {
    const res = await api.register(email, password, fullName);
    localStorage.setItem("atlas_token", res.access_token);
    setUser(res.user);
    const wsList = await api.getWorkspaces();
    setWorkspaces(wsList);
    if (wsList.length > 0) setCurrentWorkspace(wsList[0]);
  };

  const logout = () => {
    localStorage.removeItem("atlas_token");
    setUser(null);
    setWorkspaces([]);
    setCurrentWorkspace(null);
  };

  const refreshWorkspaces = async () => {
    try {
      const wsList = await api.getWorkspaces();
      setWorkspaces(wsList);
      if (wsList.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(wsList[0]);
      }
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspaces,
        currentWorkspace,
        isLoading,
        login,
        register,
        logout,
        setCurrentWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
