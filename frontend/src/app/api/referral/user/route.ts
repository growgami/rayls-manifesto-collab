import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/features/signing/modules/auth/lib/auth.lib';
import { getDatabase } from '@/shared/lib/mongodb.lib';
import { ReferralModel } from '@/features/signing/modules/referral/models/referral.model';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !session.user?.twitterData) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    const xId = session.user.twitterData.id;
    const db = await getDatabase();
    const referralModel = new ReferralModel(db);

    const referral = await referralModel.findByXId(xId);

    if (!referral) {
      return NextResponse.json(
        { error: 'Referral not found', success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      referralCode: referral.referralCode,
      position: referral.position,
      referralCount: referral.referralCount,
      linkVisits: referral.linkVisits,
      isKOL: referral.isKOL,
    });
  } catch (error) {
    console.error('Error fetching user referral:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral', success: false },
      { status: 500 }
    );
  }
}
