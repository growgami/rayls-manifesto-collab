'use client';

import { useEffect, useState, useRef } from 'react';

interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

interface UseManifestoPageTimerReturn {
  sessionId: string;
  utmId: string | null;
  activeTime: number;
  isTracking: boolean;
  error: string | null;
}

// Generate unique session ID
const generateSessionId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Extract UTM parameters from URL
const extractUtmParams = (): UtmParams => {
  if (typeof window === 'undefined') return {};

  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_term: urlParams.get('utm_term') || undefined,
    utm_content: urlParams.get('utm_content') || undefined,
  };
};

export function useManifestoPageTimer(): UseManifestoPageTimerReturn {
  const [sessionId] = useState(() => generateSessionId());
  const [utmId, setUtmId] = useState<string | null>(null);
  const [activeTime, setActiveTime] = useState<number>(0);
  const [isTracking, setIsTracking] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const lastActiveTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPageVisibleRef = useRef<boolean>(true);
  const utmIdRef = useRef<string | null>(null);
  const hasInitialized = useRef<boolean>(false);

  // Update the ref when utmId changes
  useEffect(() => {
    utmIdRef.current = utmId;
  }, [utmId]);

  // Initialize tracking on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Send initial UTM data
    const sendInitialData = async () => {
      try {
        const utmParams = extractUtmParams();

        const payload = {
          sessionId,
          ...utmParams,
          userAgent: navigator.userAgent,
          url: window.location.href,
          sessionStartTime: new Date().toISOString(),
        };

        const response = await fetch('/api/collect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (data.success) {
          setUtmId(data.utmId);
        } else {
          throw new Error(data.error || 'Failed to send UTM data');
        }
      } catch (err) {
        console.error('Error sending initial UTM data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    sendInitialData();

    // Set up visibility change listener
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      const now = Date.now();

      if (isVisible && !isPageVisibleRef.current) {
        // Page became visible - resume tracking
        lastActiveTimeRef.current = now;
        isPageVisibleRef.current = true;
        setIsTracking(true);
      } else if (!isVisible && isPageVisibleRef.current) {
        // Page became hidden - pause tracking and update active time
        const timeToAdd = now - lastActiveTimeRef.current;
        setActiveTime(prev => prev + timeToAdd);
        isPageVisibleRef.current = false;
        setIsTracking(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up interval to update active time every second
    intervalRef.current = setInterval(() => {
      if (isPageVisibleRef.current) {
        const now = Date.now();
        const timeToAdd = now - lastActiveTimeRef.current;
        setActiveTime(prev => prev + timeToAdd);
        lastActiveTimeRef.current = now;
      }
    }, 1000);

    // Send final duration on page exit
    const sendFinalDuration = (finalActiveTime: number) => {
      if (!utmIdRef.current) return;

      const payload = {
        sessionEndTime: new Date().toISOString(),
        sessionDuration: finalActiveTime,
      };

      try {
        // Use sendBeacon with proper content type for reliability during page unload
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const sent = navigator.sendBeacon(`/api/collect/${utmIdRef.current}`, blob);

        if (!sent) {
          console.warn('sendBeacon returned false - queue full or permission denied');
        }
      } catch (err) {
        console.error('Error sending beacon:', err);
      }
    };

    // Handle page unload
    const handleBeforeUnload = () => {
      const now = Date.now();
      const currentActiveTime = isPageVisibleRef.current
        ? activeTime + (now - lastActiveTimeRef.current)
        : activeTime;

      if (utmIdRef.current && currentActiveTime > 0) {
        sendFinalDuration(currentActiveTime);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionId]); // Only depend on sessionId

  return {
    sessionId,
    utmId,
    activeTime,
    isTracking,
    error,
  };
}