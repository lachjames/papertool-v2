import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { apiGet } from '../services/api';
import { ArchiveSummary } from '../types';
import { useAuth } from '../auth/AuthContext';
import { useApiContext } from './ApiContext';

interface ArchiveContextValue {
  archives: ArchiveSummary[];
  selectedArchiveId: string | null;
  setSelectedArchiveId: (id: string) => void;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const ArchiveContext = createContext<ArchiveContextValue | undefined>(undefined);

const ARCHIVE_STORAGE_KEY = 'papertool.selectedArchiveId';

export const ArchiveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { apiConfig } = useApiContext();

  const [archives, setArchives] = useState<ArchiveSummary[]>([]);
  const [selectedArchiveId, setSelectedArchiveIdState] = useState<string | null>(() => {
    return localStorage.getItem(ARCHIVE_STORAGE_KEY);
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadArchives = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiGet<ArchiveSummary[]>('archives');
      const list = res.data || [];
      setArchives(list);

      // If we don't have a selected archive or it's no longer present, pick a sensible default.
      if (!selectedArchiveId || !list.some(a => a.id === selectedArchiveId)) {
        if (list.length === 1) {
          const only = list[0];
          setSelectedArchiveIdState(only.id);
          localStorage.setItem(ARCHIVE_STORAGE_KEY, only.id);
        } else {
          // Multiple archives: leave selection null and let the UI prompt the user.
          setSelectedArchiveIdState(null);
          localStorage.removeItem(ARCHIVE_STORAGE_KEY);
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load archives');
    } finally {
      setLoading(false);
    }
  }, [selectedArchiveId]);

  // IMPORTANT:
  // The server requires auth (Cognito cookies) OR an API key for /archives.
  // On the OAuth callback page load, ArchiveProvider can mount before cookies are set,
  // causing a 401 and an empty dropdown until a hard refresh.
  // We therefore (a) avoid loading while auth is still in-flight, and
  // (b) reload once auth (or apiKey) becomes available.
  useEffect(() => {
    if (authLoading) return;
    const canLoad = !!apiConfig.key || isAuthenticated;
    if (!canLoad) return;
    loadArchives();
  }, [authLoading, apiConfig.key, isAuthenticated, loadArchives]);

  const setSelectedArchiveId = (id: string) => {
    setSelectedArchiveIdState(id);
    if (id) {
      localStorage.setItem(ARCHIVE_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(ARCHIVE_STORAGE_KEY);
    }
  };

  const value: ArchiveContextValue = {
    archives,
    selectedArchiveId,
    setSelectedArchiveId,
    loading,
    error,
    refresh: loadArchives
  };

  return (
    <ArchiveContext.Provider value={value}>
      {children}
    </ArchiveContext.Provider>
  );
};

export function useArchive(): ArchiveContextValue {
  const ctx = useContext(ArchiveContext);
  if (!ctx) {
    throw new Error('useArchive must be used within an ArchiveProvider');
  }
  return ctx;
}
