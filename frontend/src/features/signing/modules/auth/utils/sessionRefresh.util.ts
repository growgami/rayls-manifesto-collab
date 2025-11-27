/**
 * Session Refresh Utility
 *
 * Forces NextAuth to re-fetch the session from the JWT token.
 * Use this after mutations that change user data (wallet creation, referral updates)
 * to ensure the client session reflects the latest server state.
 *
 * @example
 * ```typescript
 * // After creating a wallet
 * await fetch('/api/wallet', { method: 'POST', body: ... });
 * await refreshSession(); // Update session with new wallet data
 * ```
 */
export const refreshSession = async (): Promise<void> => {
  // Trigger NextAuth's session polling mechanism
  // This causes useSession() to re-fetch the session
  const event = new Event("visibilitychange");
  document.dispatchEvent(event);

  // Wait a bit for the session to refresh
  await new Promise(resolve => setTimeout(resolve, 100));
};
