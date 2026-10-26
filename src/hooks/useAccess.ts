import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../services/api';
import { useAuth } from '../auth/AuthContext';

export interface MyAccess {
  isAdmin: boolean;
  ownerOf: string[];
  editorOf: string[];
  archiveCreatorOf: string[];
}

export function useAccess() {
  const { isAuthenticated } = useAuth();
  const [access, setAccess] = useState<MyAccess | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccess = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiGet<MyAccess>('access/me');
      setAccess(res.data);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch access');
      setAccess(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) fetchAccess();
  }, [isAuthenticated, fetchAccess]);

  return {
    access,
    isAdmin: !!access?.isAdmin,
    editorOf: access?.editorOf || [],
    ownerOf: access?.ownerOf || [],
    archiveCreatorOf: access?.archiveCreatorOf || [],
    loading,
    error,
    refresh: fetchAccess
  } as const;
}
