import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS } from '@/shared/lib/mongodb.lib';
import type { UtmDataUpdateInput } from '@/features/tracking/modules/utm/models/utmData.model';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ utmId: string }> }
) {
  try {
    const { utmId } = await params;

    // Handle both regular fetch and sendBeacon requests
    let body;
    try {
      body = await request.json();
    } catch {
      // Handle sendBeacon data
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      } else {
        throw new Error('No request body received');
      }
    }

    const {
      sessionEndTime,
      sessionDuration
    }: UtmDataUpdateInput = body;

    // Validate required fields
    if (!sessionEndTime || sessionDuration === undefined) {
      return NextResponse.json(
        { error: 'sessionEndTime and sessionDuration are required', success: false },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!ObjectId.isValid(utmId)) {
      return NextResponse.json(
        { error: 'Invalid UTM ID format', success: false },
        { status: 400 }
      );
    }

    const utmCollection = await getCollection(COLLECTIONS.UTM_DATA);

    const updateData = {
      sessionEndTime: new Date(sessionEndTime),
      sessionDuration: Math.round(sessionDuration / 1000), // Convert ms to seconds
      updatedAt: new Date(),
    };

    const result = await utmCollection.updateOne(
      { _id: new ObjectId(utmId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'UTM record not found', success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: result.modifiedCount > 0
    });
  } catch (error) {
    console.error('Error updating UTM data:', error);

    return NextResponse.json(
      {
        error: 'Failed to update UTM data',
        success: false
      },
      { status: 500 }
    );
  }
}