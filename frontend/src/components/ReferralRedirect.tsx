'use client';

import { useEffect } from 'react';

interface ReferralRedirectProps {
  refCode: string;
}

export function ReferralRedirect({ refCode }: ReferralRedirectProps) {
  useEffect(() => {
    console.log('[REFERRAL-REDIRECT] Current origin:', window.location.origin);
    console.log('[REFERRAL-REDIRECT] Ref code:', refCode);
    console.log('[REFERRAL-REDIRECT] Redirecting to:', `/api/referral/track?ref=${refCode}`);

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
