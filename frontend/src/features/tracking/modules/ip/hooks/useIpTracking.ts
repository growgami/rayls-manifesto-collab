'use client';

import { useEffect, useState, useCallback } from 'react';

interface UseIpTrackingProps {
  sessionId: string;
  enabled?: boolean;
  endpoint?: string; // Allow custom endpoint for testing
}

interface UseIpTrackingReturn {
  ipId: string | null;
  ipAddress: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useIpTracking({
  sessionId,
  enabled = true,
  endpoint = '/api/ip'
}: UseIpTrackingProps): UseIpTrackingReturn {
  const [ipId, setIpId] = useState<string | null>(null);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendIpData = useCallback(async () => {
    if (!enabled || !sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        sessionId,
        userAgent: navigator.userAgent,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setIpId(data.ipId);
        setIpAddress(data.ipAddress);
      } else {
        throw new Error(data.error || 'Failed to send IP data');
      }
    } catch (err) {
      console.error('Error sending IP data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, enabled, endpoint]);

  useEffect(() => {
    sendIpData();
  }, [sendIpData]);

  return {
    ipId,
    ipAddress,
    isLoading,
    error,
  };
}