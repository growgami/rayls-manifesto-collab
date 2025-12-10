import { Queue, QueueEvents } from 'bullmq';
import { getRedisClient } from './redis.lib';

let referralQueue: Queue | null = null;
let queueEvents: QueueEvents | null = null;

export async function getReferralQueue(): Promise<Queue> {
  if (referralQueue) return referralQueue;

  const connection = await getRedisClient();
  const prefix = process.env.BULL_QUEUE_PREFIX || 'rayls';

  referralQueue = new Queue('referral-creation', {
    connection,
    prefix,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000, // 2s, 4s, 8s, 16s, 32s
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 1000,
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
      },
    },
  });

  queueEvents = new QueueEvents('referral-creation', {
    connection,
    prefix,
  });

  console.log('✅ Referral queue initialized');

  return referralQueue;
}

export function getQueueEvents(): QueueEvents | null {
  return queueEvents;
}

export async function closeQueue(): Promise<void> {
  if (referralQueue) {
    await referralQueue.close();
    referralQueue = null;
  }
  if (queueEvents) {
    await queueEvents.close();
    queueEvents = null;
  }
  console.log('✅ Queue closed');
}
