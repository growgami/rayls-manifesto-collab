'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { DeviceDetectionService } from '../services/deviceDetection.service';

interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

interface UseTrackingReturn {
  // Session
  sessionId: string;
  // UTM tracking
  utmId: string | null;
  activeTime: number;
  isTracking: boolean;
  // IP tracking
  ipId: string | null;
  ipAddress: string | null;
  // Status
  isLoading: boolean;
  error: string | null;
}

interface UseTrackingOptions {
  enabled?: boolean;
}

const generateSessionId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

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

export function useTracking(options: UseTrackingOptions = {}): UseTrackingReturn {
  const { enabled = true } = options;

  // Session state
  const [sessionId] = useState(() => generateSessionId());

  // UTM tracking state
  const [utmId, setUtmId] = useState<string | null>(null);
  const [activeTime, setActiveTime] = useState<number>(0);
  const [isTracking, setIsTracking] = useState<boolean>(true);

  // IP tracking state
  const [ipId, setIpId] = useState<string | null>(null);
  const [ipAddress, setIpAddress] = useState<string | null>(null);

  // Status state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for tracking
  const lastActiveTimeRef = useRef<number>(Date.now());
  const activeTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPageVisibleRef = useRef<boolean>(true);
  const utmIdRef = useRef<string | null>(null);
  const hasInitialized = useRef<boolean>(false);

  // Keep utmId ref in sync
  useEffect(() => {
    utmIdRef.current = utmId;
  }, [utmId]);

  // Send IP data
  const sendIpData = useCallback(async () => {
    if (!enabled || !sessionId) return;

    try {
      const response = await fetch('/api/ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userAgent: navigator.userAgent,
        }),
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
    }
  }, [sessionId, enabled]);

  // Initialize all tracking on mount
  useEffect(() => {
    if (!enabled || hasInitialized.current) return;
    hasInitialized.current = true;

    setIsLoading(true);

    // Send initial UTM data
    const sendUtmData = async () => {
      try {
        const utmParams = extractUtmParams();

        // Detect device type
        const deviceInfo = DeviceDetectionService.detectFromBrowser();

        // Capture referrer
        const referrer = document.referrer || undefined;

        // Extract referral code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('ref') || undefined;

        const response = await fetch('/api/collect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            ...utmParams,
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer,
            referralCode,
            deviceType: deviceInfo.type,
            sessionStartTime: new Date().toISOString(),
          }),
        });

        const data = await response.json();

        if (data.success) {
          setUtmId(data.utmId);
        } else {
          throw new Error(data.error || 'Failed to send UTM data');
        }
      } catch (err) {
        console.error('Error sending UTM data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    // Run both in parallel
    Promise.all([sendUtmData(), sendIpData()]).finally(() => {
      setIsLoading(false);
    });

    // Visibility change handler
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      const now = Date.now();

      if (isVisible && !isPageVisibleRef.current) {
        lastActiveTimeRef.current = now;
        isPageVisibleRef.current = true;
        setIsTracking(true);
      } else if (!isVisible && isPageVisibleRef.current) {
        const timeToAdd = now - lastActiveTimeRef.current;
        activeTimeRef.current += timeToAdd;
        setActiveTime(activeTimeRef.current);
        isPageVisibleRef.current = false;
        setIsTracking(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Update active time every second
    intervalRef.current = setInterval(() => {
      if (isPageVisibleRef.current) {
        const now = Date.now();
        const timeToAdd = now - lastActiveTimeRef.current;
        activeTimeRef.current += timeToAdd;
        setActiveTime(activeTimeRef.current);
        lastActiveTimeRef.current = now;
      }
    }, 1000);

    // Send final duration on exit
    const sendFinalDuration = async (finalActiveTime: number) => {
      if (!utmIdRef.current) return;

      const payload = {
        sessionEndTime: new Date().toISOString(),
        sessionDuration: finalActiveTime,
        updatedAt: new Date().toISOString(),
      };

      try {
        await fetch(`/api/collect/${utmIdRef.current}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(`/api/collect/${utmIdRef.current}`, blob);
      }
    };

    const handleBeforeUnload = () => {
      const now = Date.now();
      const pendingTime = isPageVisibleRef.current ? now - lastActiveTimeRef.current : 0;
      const totalActiveTime = activeTimeRef.current + pendingTime;

      if (utmIdRef.current && totalActiveTime > 0) {
        sendFinalDuration(totalActiveTime);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionId, enabled, sendIpData]);

  return {
    sessionId,
    utmId,
    activeTime,
    isTracking,
    ipId,
    ipAddress,
    isLoading,
    error,
  };
}
