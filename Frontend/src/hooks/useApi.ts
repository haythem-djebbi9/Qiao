import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

type Query = Record<string, string | number | boolean | null | undefined>;

/**
 * Charge une ressource GET de l'API et la recharge quand le chemin ou les filtres changent.
 * `path` à null désactive le chargement.
 */
export function useApi<T>(path: string | null, query?: Query, initial?: T) {
  const [data, setData] = useState<T | undefined>(initial);
  const [loading, setLoading] = useState(path !== null);
  const [error, setError] = useState<string | null>(null);
  const queryKey = JSON.stringify(query ?? {});
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (path === null) return;
    const id = ++requestId.current;
    setLoading(true);
    try {
      const result = await api.get<T>(path, JSON.parse(queryKey));
      if (id === requestId.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (id === requestId.current) setError(err instanceof Error ? err.message : 'Erreur de chargement.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [path, queryKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, setData, loading, error, reload: load };
}
