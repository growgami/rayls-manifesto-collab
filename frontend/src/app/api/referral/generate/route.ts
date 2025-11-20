import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { ReferralModel, IReferralCreate } from '@/features/referral/models/referral.model';
import { ReferralCodeGenerator } from '@/features/referral/utils/referral.util';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'usdai';

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client.db(DB_NAME);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, maxTarget = 100 } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const referralModel = new ReferralModel(db);

    const existingReferral = await referralModel.findByEmail(email);
    if (existingReferral) {
      return NextResponse.json(
        { error: 'Email already has a referral code' },
        { status: 409 }
      );
    }

    let referralCode = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      referralCode = ReferralCodeGenerator.generateCode();
      const existing = await referralModel.findByReferralCode(referralCode);
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Unable to generate unique referral code. Please try again.' },
        { status: 500 }
      );
    }

    const apiKey = ReferralCodeGenerator.generateApiKey();
    const totalReferrals = await db.collection('referrals').countDocuments();

    const newReferralData: IReferralCreate = {
      email,
      referralCode,
      referredBy: null,
      referralCount: 0,
      linkVisits: 0,
      position: totalReferrals + 1,
      maxTarget,
      apiKey,
      ipAddress: 'api-generated'
    };

    const newReferral = await referralModel.create(newReferralData);

    const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/?ref=${referralCode}`;

    return NextResponse.json({
      success: true,
      data: {
        id: newReferral._id,
        email: newReferral.email,
        referralCode: newReferral.referralCode,
        referralLink,
        apiKey: newReferral.apiKey,
        position: newReferral.position,
        maxTarget: newReferral.maxTarget,
        createdAt: newReferral.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating referral code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}