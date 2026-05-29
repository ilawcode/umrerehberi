import { useState, useEffect } from 'react';

export function useCachedFetch<T>(
  cacheKey: string,
  apiUrl: string,
  initialData: T
) {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try to load from localStorage first (runs only on client)
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored) as T;
        if (parsed) {
          setData(parsed);
          setLoading(false); // Disable spinner since we have cached data
        }
      }
    } catch (e) {
      console.warn(`Error reading cache for key "${cacheKey}":`, e);
    }

    // 2. Fetch fresh data from network in background
    let active = true;
    async function fetchFreshData() {
      try {
        const res = await fetch(apiUrl);
        if (!res.ok) {
          throw new Error(`Fetch failed for ${apiUrl}`);
        }
        const json = await res.json();
        if (json.success && json.data) {
          const freshData = json.data as T;
          
          if (!active) return;

          // 3. Save to localStorage
          try {
            localStorage.setItem(cacheKey, JSON.stringify(freshData));
          } catch (e) {
            console.warn(`Error saving cache for key "${cacheKey}":`, e);
          }

          // 4. Only update state if data changed to prevent unnecessary re-renders
          setData(prev => {
            if (JSON.stringify(prev) === JSON.stringify(freshData)) {
              return prev;
            }
            return freshData;
          });
        }
      } catch (e) {
        console.warn(`API connection failed for ${apiUrl}, using cache or offline fallback:`, e);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchFreshData();

    return () => {
      active = false;
    };
  }, [cacheKey, apiUrl]);

  return { data, loading };
}
