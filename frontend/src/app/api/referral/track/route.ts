import { NextRequest, NextResponse } from 'next/server';
import { ReferralModel } from '@/features/referral/models/referral.model';
import { ReferralCodeGenerator, ReferralCookieManager, ReferralContext } from '@/features/referral/services/referralGenerator.service';
import { getDatabase } from '@/shared/lib/mongodb.lib';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refCode = searchParams.get('ref');

    if (!refCode) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const validation = ReferralCodeGenerator.isValidFormat(refCode);
    if (!validation.valid) {
      console.warn(`Invalid referral code format: ${refCode}`);
      return NextResponse.redirect(new URL('/', request.url));
    }

    const db = await getDatabase();
    const referralModel = new ReferralModel(db);

    const referrer = await referralModel.findByReferralCode(refCode);
    if (!referrer) {
      console.warn(`Referral code not found: ${refCode}`);
      return NextResponse.redirect(new URL('/', request.url));
    }

    await referralModel.incrementLinkVisits(refCode);

    const referralContext: ReferralContext = {
      referralCode: refCode,
      timestamp: Date.now(),
      referrerXId: referrer.xId
    };

    const response = NextResponse.redirect(new URL('/', request.url));
    ReferralCookieManager.setCookie(response, referralContext);

    return response;

  } catch (error) {
    console.error('Error tracking referral:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}