import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { ReferralModel, IReferralCreate } from '@/features/referral/models/referral.model';
import { ReferralCodeGenerator, ReferralCookieManager } from '@/features/referral/utils/referral.util';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'usdai';

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client.db(DB_NAME);
}

function getClientIP(request: NextRequest): string {
  // Check various headers for real IP (in order of preference)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  // Fallback - no reliable way to get client IP without headers
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, maxTarget = 100 } = body;
    const clientIP = getClientIP(request);

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


    // Check for existing user by email
    const existingUserByEmail = await referralModel.findByEmail(email);
    if (existingUserByEmail) {
      const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/?ref=${existingUserByEmail.referralCode}`;
      
      return NextResponse.json({
        success: true,
        data: {
          id: existingUserByEmail._id,
          email: existingUserByEmail.email,
          referralCode: existingUserByEmail.referralCode,
          referralLink,
          referredBy: existingUserByEmail.referredBy,
          position: existingUserByEmail.position,
          maxTarget: existingUserByEmail.maxTarget,
          createdAt: existingUserByEmail.createdAt
        },
        isExistingUser: true
      }, { status: 200 });
    }


    const referralContext = ReferralCookieManager.getCookie(request);
    const hasValidReferral = ReferralCookieManager.isValidContext(referralContext);

    let referralCode: string = '';
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
      ipAddress: clientIP
    };

    let newUser;
    let referrer = null;

    if (hasValidReferral && referralContext?.referrerEmail) {
      const { newUser: createdUser, referrer: updatedReferrer } = await referralModel.createWithReferrer(
        newReferralData,
        referralContext.referrerEmail
      );
      newUser = createdUser;
      referrer = updatedReferrer;
    } else {
      newUser = await referralModel.create(newReferralData);
    }

    const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/?ref=${referralCode}`;

    const response = NextResponse.json({
      success: true,
      data: {
        id: newUser._id,
        email: newUser.email,
        referralCode: newUser.referralCode,
        referralLink,
        referredBy: newUser.referredBy,
        position: newUser.position,
        maxTarget: newUser.maxTarget,
        createdAt: newUser.createdAt
      },
      referrer: referrer ? {
        email: referrer.email,
        referralCount: referrer.referralCount
      } : null
    }, { status: 201 });

    if (hasValidReferral) {
      ReferralCookieManager.clearCookie(response);
    }

    return response;

  } catch (error) {
    console.error('Error during signup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}