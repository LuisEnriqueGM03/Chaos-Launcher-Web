'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modpack } from '../../../core/types/modpack.types';
import { modpacksApi } from '../infrastructure/modpacks.api';

export function useModpacks(includeInactive = false) {
  const [modpacks, setModpacks] = useState<Modpack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModpacks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await modpacksApi.getAll(includeInactive);
      setModpacks(data);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los modpacks');
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchModpacks();
  }, [fetchModpacks]);

  return {
    modpacks,
    loading,
    error,
    refetch: fetchModpacks,
  };
}
