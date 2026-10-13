'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Tiny stale-while-revalidate cache: pages show the last data instantly
// and refresh it in the background, so switching tabs does not flash "loading".
const cache = new Map<string, unknown>();

export function clearCache() {
  cache.clear();
}

export function useQuery<T>(key: string | null, fn: () => Promise<T>) {
  const [data, setData] = useState<T | undefined>(() => (key ? (cache.get(key) as T | undefined) : undefined));
  const [error, setError] = useState('');
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const reload = useCallback(async () => {
    if (!key) return;
    try {
      const v = await fnRef.current();
      cache.set(key, v);
      setData(v);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'error');
    }
  }, [key]);

  useEffect(() => {
    if (key) setData(cache.get(key) as T | undefined);
    reload();
  }, [key, reload]);

  const mutate = useCallback(
    (v: T) => {
      if (key) cache.set(key, v);
      setData(v);
    },
    [key]
  );

  return { data, error, reload, mutate, loading: !!key && data === undefined && !error };
}
