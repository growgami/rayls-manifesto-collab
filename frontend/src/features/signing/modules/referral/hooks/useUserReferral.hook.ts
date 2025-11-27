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

/**
 * useUserReferral Hook
 *
 * Now reads referral data from NextAuth session instead of making API calls.
 * This eliminates the GET /api/referral/user request from the network tab.
 *
 * The referral data is fetched during OAuth callback and stored in the session.
 */
export const useUserReferral = (): UseUserReferralReturn => {
  const { isAuthenticated, user } = useAuth();

  // Read referral data directly from session (no API call)
  const referralData = user?.referralData;

  return {
    referralCode: referralData?.referralCode || null,
    data: referralData || null,
    isLoading: false, // No loading state - data comes from session
    error: null, // No error state - session always succeeds
  };
};
