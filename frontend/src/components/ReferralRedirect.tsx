'use client';

import { useEffect } from 'react';

interface ReferralRedirectProps {
  refCode: string;
}

export function ReferralRedirect({ refCode }: ReferralRedirectProps) {
  useEffect(() => {
    // Client-side redirect uses the browser's current origin
    window.location.href = `/api/referral/track?ref=${refCode}`;
  }, [refCode]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="text-center">
        <div className="animate-pulse">Processing referral...</div>
      </div>
    </div>
  );
}
