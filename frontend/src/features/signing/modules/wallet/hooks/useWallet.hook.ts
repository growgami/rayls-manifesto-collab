import { useEffect, useState } from 'react';
import { useAuth } from '@/features/signing/modules/auth/hooks/useAuth.hook';
import { IWallet } from '../types/wallet.types';

interface UseWalletReturn {
  wallet: IWallet | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useWallet = (): UseWalletReturn => {
  const { isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState<IWallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const fetchWallet = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/wallet');
        const result = await response.json();

        // 404 is not an error - it means no wallet exists
        if (response.status === 404) {
          setWallet(null);
          setError(null);
          return;
        }

        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch wallet');
        }

        setWallet(result.wallet);
      } catch (err) {
        console.error('Error fetching wallet:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWallet();
  }, [isAuthenticated, refetchTrigger]);

  return {
    wallet,
    isLoading,
    error,
    refetch,
  };
};
