import { useEffect, useState } from 'react';
import { useAuth } from '@/features/signing/modules/auth/hooks/useAuth.hook';

interface UserReferralData {
  referralCode: string;
  position: number;
  referralCount: number;
  linkVisits: number;
  isKOL: boolean;
}

interface UseUserReferralReturn {
  referralCode: string | null;
  data: UserReferralData | null;
  isLoading: boolean;
  error: string | null;
}

export const useUserReferral = (): UseUserReferralReturn => {
  const { isAuthenticated, referralCode: sessionReferralCode } = useAuth();
  const [data, setData] = useState<UserReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If referralCode is already in session, use it
    if (sessionReferralCode) {
      return;
    }

    // Only fetch if authenticated and no referralCode in session
    if (!isAuthenticated) {
      return;
    }

    const fetchReferralCode = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/referral/user');
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch referral code');
        }

        setData(result);
      } catch (err) {
        console.error('Error fetching referral code:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferralCode();
  }, [isAuthenticated, sessionReferralCode]);

  return {
    referralCode: sessionReferralCode || data?.referralCode || null,
    data,
    isLoading,
    error,
  };
};
