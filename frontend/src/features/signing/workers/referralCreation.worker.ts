import { Worker, Job } from 'bullmq';
import { getRedisClient } from '@/shared/lib/redis.lib';
import { ReferralCodeGenerator } from '../modules/referral/services/referralGenerator.service';

let worker: Worker | null = null;

interface ReferralJobData {
  xId: string;
  username: string;
  name: string;
  email?: string;
  image?: string;
  twitterData: any;
  referredByCode?: string;
}

async function processReferralJob(job: Job<ReferralJobData>) {
  const { xId, username, referredByCode } = job.data;

  console.log(`🔄 [WORKER] Processing referral for @${username} (xId: ${xId})`);

  try {
    const result = await ReferralCodeGenerator.createUserReferral({
      xId,
      username,
      referredByCode,
    });

    // CRITICAL VALIDATION: Reject invalid positions
    if (!result.position || result.position <= 500) {
      throw new Error(
        `Invalid position assigned: ${result.position}. Counter may not be initialized.`
      );
    }

    console.log(
      `✅ [WORKER] Referral created for @${username}: #${result.position} (${result.referralCode})`
    );

    return {
      success: true,
      referralCode: result.referralCode,
      position: result.position,
      isKOL: result.isKOL,
    };
  } catch (error) {
    console.error(`❌ [WORKER] Failed for @${username}:`, error);
    throw error; // Let BullMQ handle retries
  }
}

export async function startReferralWorker(): Promise<void> {
  if (worker) {
    console.log('⚠️ Worker already running');
    return;
  }

  const connection = await getRedisClient();
  const prefix = process.env.BULL_QUEUE_PREFIX || 'rayls';
  const concurrency = parseInt(process.env.BULL_CONCURRENCY || '5', 10);

  worker = new Worker('referral-creation', processReferralJob, {
    connection,
    prefix,
    concurrency,
    limiter: {
      max: 10,
      duration: 1000, // 10 jobs per second
    },
  });

  worker.on('completed', (job) => {
    console.log(`✅ [WORKER] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [WORKER] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('❌ [WORKER] Worker error:', err);
  });

  console.log(`✅ Referral worker started (concurrency: ${concurrency})`);
}

export async function stopReferralWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    console.log('✅ Worker stopped');
  }
}
