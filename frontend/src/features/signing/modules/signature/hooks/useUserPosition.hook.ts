'use client';

import { useAuth } from '@/features/signing/modules/auth/hooks/useAuth.hook';

interface UseUserPositionReturn {
  data: number | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * useUserPosition Hook
 *
 * Now reads position data from NextAuth session instead of making API calls.
 * This eliminates the GET /api/signature/position request from the network tab.
 *
 * The position is fetched during OAuth callback and stored in the session.
 */
export function useUserPosition(): UseUserPositionReturn {
  const { user } = useAuth();

  // Read position directly from session (no API call)
  const position = user?.position;

  return {
    data: position || null,
    isLoading: false, // No loading state - data comes from session
    error: null, // No error state - session always succeeds
  };
}
