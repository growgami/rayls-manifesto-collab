'use client';

import { useEffect, useState } from 'react';

interface UseSignatureCountReturn {
  data: number | null;
  isLoading: boolean;
  error: string | null;
}

export function useSignatureCount(): UseSignatureCountReturn {
  const [data, setData] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/signature/count');
        const result = await response.json();

        if (result.success) {
          setData(result.count);
          setError(null);
        } else {
          throw new Error(result.error || 'Failed to fetch signature count');
        }
      } catch (err) {
        console.error('Error fetching signature count:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
  }, []);

  return { data, isLoading, error };
}
