import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/features/signing/modules/auth/lib/auth.lib';
import { getDatabase } from '@/shared/lib/mongodb.lib';
import { ReferralModel } from '@/features/signing/modules/referral/models/referral.model';
import { getReferralQueue } from '@/shared/lib/queue.lib';

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const xId = session.user.id;

    // Check if referral already exists (completed state)
    const db = await getDatabase();
    const referral = await new ReferralModel(db).findByXId(xId);

    if (referral) {
      return NextResponse.json({
        status: 'completed',
        position: referral.position,
        referralCode: referral.referralCode,
        isKOL: referral.isKOL,
      });
    }

    // Check job status in queue
    const queue = await getReferralQueue();
    const jobId = `referral-${xId}`;
    const job = await queue.getJob(jobId);

    if (!job) {
      // No job found - might need to create one
      return NextResponse.json({
        status: 'not_found',
        error: 'No referral creation job found',
      });
    }

    const state = await job.getState();
    const waitingCount = await queue.getWaitingCount();
    const estimatedWaitTime = Math.ceil((waitingCount * 2) / 5); // 5 concurrency, ~2s per job

    if (state === 'completed') {
      // Job completed, refetch referral
      const referralAfterJob = await new ReferralModel(db).findByXId(xId);
      return NextResponse.json({
        status: 'completed',
        position: referralAfterJob?.position,
        referralCode: referralAfterJob?.referralCode,
        isKOL: referralAfterJob?.isKOL,
      });
    }

    if (state === 'failed') {
      const failedReason = job.failedReason;
      return NextResponse.json({
        status: 'failed',
        error: failedReason || 'Referral creation failed. Please try again in 1 hour.',
      });
    }

    // Pending or processing
    return NextResponse.json({
      status: state === 'active' ? 'processing' : 'pending',
      estimatedWaitTime,
    });
  } catch (error) {
    console.error('❌ [API] Referral status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
