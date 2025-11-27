import { useEffect, useState } from 'react';
import { useAuth } from '@/features/signing/modules/auth/hooks/useAuth.hook';
import { IWallet } from '../types/wallet.types';
import { WalletDTO } from '@/shared/types/dto.types';

interface UseWalletReturn {
  // The session stores the sanitized wallet DTO (xId removed),
  // so consumers should expect the DTO shape rather than the full DB model.
  wallet: WalletDTO | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * useWallet Hook
 *
 * Now reads wallet data from NextAuth session instead of making API calls.
 * This eliminates the GET /api/wallet request from the network tab.
 *
 * The wallet data is fetched during OAuth callback and stored in the session.
 * Call refetch() after creating a wallet to trigger session refresh.
 */
export const useWallet = (): UseWalletReturn => {
  const { isAuthenticated, user } = useAuth();
  const [wallet, setWallet] = useState<WalletDTO | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setWallet(null);
      return;
    }

    // Read wallet directly from session (no API call)
    setWallet(user.wallet || null);
  }, [isAuthenticated, user, user?.wallet, refetchTrigger]);

  return {
    wallet,
    isLoading: false, // No loading state needed - data comes from session
    error: null, // No error state needed - session always succeeds
    refetch,
  };
};
