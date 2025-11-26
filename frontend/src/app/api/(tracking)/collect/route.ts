import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, getDatabase } from '@/shared/lib/mongodb.lib';
import { ReferralModel } from '@/features/signing/modules/referral/models/referral.model';
import type { UtmDataCreateInput } from '@/features/tracking/modules/utm/models/utmData.model';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      sessionId,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      userAgent,
      url,
      referrer,
      referralCode,
      deviceType
    }: UtmDataCreateInput = body;

    // Validate required fields
    if (!sessionId || !url) {
      return NextResponse.json(
        { error: 'sessionId and url are required', success: false },
        { status: 400 }
      );
    }

    const utmCollection = await getCollection(COLLECTIONS.UTM_DATA);

    const utmData = {
      sessionId,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      userAgent,
      url,
      referrer,
      referralCode,
      deviceType,
      sessionStartTime: new Date(),
      sessionEndTime: null,
      sessionDuration: null,
      createdAt: new Date(),
    };

    const result = await utmCollection.insertOne(utmData);

    // Increment linkVisits if referral code is present
    if (referralCode) {
      try {
        const db = await getDatabase();
        const referralModel = new ReferralModel(db);
        await referralModel.incrementLinkVisits(referralCode);
      } catch (refError) {
        console.error('Error incrementing link visits:', refError);
        // Don't fail the whole request if referral increment fails
      }
    }

    return NextResponse.json({
      utmId: result.insertedId.toString(),
      success: true
    });
  } catch (error) {
    console.error('Error saving UTM data:', error);

    return NextResponse.json(
      {
        error: 'Failed to save UTM data',
        success: false
      },
      { status: 500 }
    );
  }
}