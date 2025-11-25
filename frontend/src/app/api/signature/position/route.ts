import { NextResponse } from 'next/server';
import { getServerSession } from '@/features/signing/modules/auth/lib/auth.lib';
import { getDatabase } from '@/shared/lib/mongodb.lib';
import { ReferralModel } from '@/features/signing/modules/referral/models/referral.model';

export async function GET() {
  try {
    // Authenticate user
    const session = await getServerSession();

    if (!session?.user?.twitterData?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }

    const xId = session.user.twitterData.id;

    // Get user's referral record
    const db = await getDatabase();
    const referralModel = new ReferralModel(db);
    const referral = await referralModel.findByXId(xId);

    if (!referral) {
      return NextResponse.json(
        {
          success: false,
          error: 'User position not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      position: referral.position
    });
  } catch (error) {
    console.error('Error fetching user position:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user position'
      },
      { status: 500 }
    );
  }
}
