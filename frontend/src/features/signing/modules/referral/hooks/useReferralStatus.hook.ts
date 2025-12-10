import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface ReferralStatus {
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed' | 'not_found';
  position?: number;
  referralCode?: string;
  isKOL?: boolean;
  error?: string;
  estimatedWaitTime?: number;
}

export function useReferralStatus(shouldPoll: boolean) {
  const [status, setStatus] = useState<ReferralStatus>({ status: 'idle' });
  const [pollCount, setPollCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { update } = useSession();

  useEffect(() => {
    if (!shouldPoll) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await fetch('/api/referral/status');
        const data = await response.json();

        setStatus(data);

        // Stop polling on completion or failure
        if (data.status === 'completed' || data.status === 'failed') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Force session refresh to update useAuth and useUserReferral hooks
          if (data.status === 'completed') {
            await update();
          }
        }

        setPollCount((prev) => prev + 1);

        // Max 60 polls (2 minutes)
        if (pollCount >= 60) {
          setStatus({
            status: 'failed',
            error: 'Request timeout. Please refresh the page.',
          });
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial poll
    pollStatus();

    // Poll every 2 seconds
    intervalRef.current = setInterval(pollStatus, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [shouldPoll, pollCount]);

  return status;
}
