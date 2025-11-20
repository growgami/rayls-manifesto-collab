import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/features/tracking/lib/mongodb.lib';
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
      url
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
      sessionStartTime: new Date(),
      sessionEndTime: null,
      sessionDuration: null,
      createdAt: new Date(),
    };

    const result = await utmCollection.insertOne(utmData);

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