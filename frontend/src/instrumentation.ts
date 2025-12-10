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

    // Start BullMQ worker
    const { startReferralWorker } = await import(
      '@/features/signing/workers/referralCreation.worker'
    );
    await startReferralWorker();

    // Graceful shutdown
    const { stopReferralWorker } = await import(
      '@/features/signing/workers/referralCreation.worker'
    );
    const { closeQueue } = await import('@/shared/lib/queue.lib');
    const { closeRedisConnection } = await import('@/shared/lib/redis.lib');

    const shutdownHandler = async () => {
      console.log('🔄 Graceful shutdown initiated...');
      await stopReferralWorker();
      await closeQueue();
      await closeRedisConnection();
      process.exit(0);
    };

    process.on('SIGTERM', shutdownHandler);
    process.on('SIGINT', shutdownHandler);
  }
}
