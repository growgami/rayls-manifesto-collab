import { NextRequest, NextResponse } from 'next/server';
import { ReferralModel } from '@/features/signing/modules/referral/models/referral.model';
import { ReferralCodeGenerator, ReferralCookieManager, ReferralContext } from '@/features/signing/modules/referral/services/referralGenerator.service';
import { getDatabase } from '@/shared/lib/mongodb.lib';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refCode = searchParams.get('ref');
    const origin = new URL(request.url).origin;

    console.log(`[REFERRAL-TRACK] request.url: ${request.url}`);
    console.log(`[REFERRAL-TRACK] origin: ${origin}`);
    console.log(`[REFERRAL-TRACK] refCode: ${refCode}`);

    if (!refCode) {
      return NextResponse.redirect(new URL('/', origin));
    }

    const validation = ReferralCodeGenerator.isValidFormat(refCode);
    if (!validation.valid) {
      console.warn(`Invalid referral code format: ${refCode}`);
      return NextResponse.redirect(new URL('/', origin));
    }

    const db = await getDatabase();
    const referralModel = new ReferralModel(db);

    const referrer = await referralModel.findByReferralCode(refCode);
    if (!referrer) {
      console.warn(`Referral code not found: ${refCode}`);
      return NextResponse.redirect(new URL('/', origin));
    }

    await referralModel.incrementLinkVisits(refCode);
    console.log(`✅ Incremented link visits for ${refCode}`);

    const referralContext: ReferralContext = {
      referralCode: refCode,
      timestamp: Date.now(),
      referrerXId: referrer.xId
    };

    const response = NextResponse.redirect(new URL('/', origin));
    ReferralCookieManager.setCookie(response, referralContext);

    console.log(`🍪 Set referral cookie - Code: ${refCode}, Referrer xId: ${referrer.xId}`);

    return response;

  } catch (error) {
    console.error('Error tracking referral:', error);
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(new URL('/', origin));
  }
}