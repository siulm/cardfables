"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface SeriesMeta {
  id: string;
  title: string;
  tagline: string;
  genre: string;
  type: string;
  color: string;
  accent: string;
  bg: string;
  desc: string;
  status: string;
}

interface AdminContextType {
  // Auth
  authenticated: boolean;
  setAuthenticated: (v: boolean) => void;
  // Series
  selectedSeries: string;
  setSelectedSeries: (v: string) => void;
  allSeries: SeriesMeta[];
  setAllSeries: (v: SeriesMeta[]) => void;
  loadSeriesList: () => Promise<void>;
  // Messages
  error: string;
  setError: (v: string) => void;
  success: string;
  setSuccess: (v: string) => void;
  // Cross-page: pre-loaded files for generate (from submissions "Use for Episode")
  preloadedFiles: File[];
  setPreloadedFiles: (v: File[]) => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState("flames-of-our-lives");
  const [allSeries, setAllSeries] = useState<SeriesMeta[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preloadedFiles, setPreloadedFiles] = useState<File[]>([]);

  const loadSeriesList = useCallback(async () => {
    try {
      const res = await fetch("/api/series");
      const data = await res.json();
      if (res.ok) setAllSeries(data.series);
    } catch {
      // Silent fail — series selector will show default
    }
  }, []);

  return (
    <AdminContext.Provider
      value={{
        authenticated, setAuthenticated,
        selectedSeries, setSelectedSeries,
        allSeries, setAllSeries, loadSeriesList,
        error, setError,
        success, setSuccess,
        preloadedFiles, setPreloadedFiles,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}
