'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/features/signing/modules/auth/hooks/useAuth.hook';

interface UseUserPositionReturn {
  data: number | null;
  isLoading: boolean;
  error: string | null;
}

export function useUserPosition(): UseUserPositionReturn {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to resolve
    if (authLoading) {
      return;
    }

    // Only fetch if authenticated
    if (!isAuthenticated) {
      setIsLoading(false);
      setData(null);
      setError(null);
      return;
    }

    const fetchPosition = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/signature/position');
        const result = await response.json();

        if (result.success) {
          setData(result.position);
          setError(null);
        } else {
          throw new Error(result.error || 'Failed to fetch user position');
        }
      } catch (err) {
        console.error('Error fetching user position:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosition();
  }, [isAuthenticated, authLoading]);

  return { data, isLoading, error };
}
