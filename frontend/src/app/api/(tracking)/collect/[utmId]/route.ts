import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS } from '@/shared/lib/mongodb.lib';
import type { UtmDataUpdateInput } from '@/features/tracking/modules/utm/models/utmData.model';

async function handleSessionEnd(
  request: NextRequest,
  utmId: string
) {
  // Handle both regular fetch and sendBeacon requests
  let body;

  // Get content type to determine how to parse
  const contentType = request.headers.get('content-type') || '';

  try {
    // Try to read as text first
    const text = await request.text();

    // If empty body, it might be a preflight or failed beacon
    if (!text || text.trim() === '') {
      // For sendBeacon, sometimes the body arrives empty - just log and return
      console.warn('Empty body received for session end, utmId:', utmId);
      return NextResponse.json(
        { success: false, error: 'Empty request body' },
        { status: 400 }
      );
    }

    body = JSON.parse(text);
  } catch (err) {
    console.error('Error parsing request body:', err);
    return NextResponse.json(
      { success: false, error: 'Invalid request body format' },
      { status: 400 }
    );
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
}

// POST handler for sendBeacon (only supports POST)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ utmId: string }> }
) {
  try {
    const { utmId } = await params;
    return handleSessionEnd(request, utmId);
  } catch (error) {
    console.error('Error updating UTM data (POST):', error);
    return NextResponse.json(
      { error: 'Failed to update UTM data', success: false },
      { status: 500 }
    );
  }
}

// PATCH handler for regular fetch requests
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ utmId: string }> }
) {
  try {
    const { utmId } = await params;
    return handleSessionEnd(request, utmId);
  } catch (error) {
    console.error('Error updating UTM data (PATCH):', error);
    return NextResponse.json(
      { error: 'Failed to update UTM data', success: false },
      { status: 500 }
    );
  }
}