import { NextResponse } from 'next/server';
import { PositionCounterService } from '@/features/signing/modules/referral/utils/positionCounter.util';

export async function GET() {
  try {
    const count = await PositionCounterService.getTotalSignatures();

    return NextResponse.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching signature count:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch signature count'
      },
      { status: 500 }
    );
  }
}
