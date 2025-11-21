import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/shared/lib/mongodb.lib';
import type { IpDataCreateInput } from '@/features/tracking/modules/ip/models/IpData';

export async function POST(request: NextRequest) {
  console.log('IP API route called');
  try {
    const body = await request.json();
    console.log('Request body:', body);

    const {
      sessionId,
      userAgent
    }: Omit<IpDataCreateInput, 'ipAddress'> = body;

    // Extract IP address from request headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    // Note: request.ip doesn't exist on NextRequest, use headers only
    const remoteAddr = request.headers.get('x-real-ip');

    let ipAddress = forwarded?.split(',')[0] || realIp || remoteAddr || 'unknown';

    // Handle development environment IPv6 loopback
    if (ipAddress === '::1' || ipAddress === ':1') {
      ipAddress = process.env.NODE_ENV === 'development' ? '127.0.0.1' : 'unknown';
    }

    // Clean up any extra whitespace
    ipAddress = ipAddress.trim();

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required', success: false },
        { status: 400 }
      );
    }

    console.log('Getting MongoDB collection...');
    const ipCollection = await getCollection(COLLECTIONS.IP_DATA);
    console.log('MongoDB collection obtained');

    const ipData = {
      sessionId,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    };
    console.log('IP data to insert:', ipData);

    const result = await ipCollection.insertOne(ipData);
    console.log('Data inserted successfully:', result.insertedId);

    return NextResponse.json({
      ipId: result.insertedId.toString(),
      ipAddress: ipAddress === 'unknown' ? null : ipAddress, // Don't expose unknown IPs
      success: true
    });
  } catch (error) {
    console.error('Error saving IP data:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');

    return NextResponse.json(
      {
        error: 'Failed to save IP data',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}