/**
 * Next.js Instrumentation Hook
 * This file is automatically called when the server starts
 * Used for one-time initialization tasks like database indexes
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeIndexes } = await import('@/shared/lib/mongodb.lib');

    // Initialize database indexes on startup
    // This is idempotent and safe to run on every deployment
    await initializeIndexes();
  }
}
