import { UserService, UserDocument } from '@/features/signing/modules/auth/utils/userDb.util';
import { ReferralCodeGenerator, ReferralCookieManager } from '@/features/signing/modules/referral/services/referralGenerator.service';
import { TwitterUserData, MIN_FOLLOWERS_REQUIRED } from '@/features/signing/modules/auth/types/user.types';
import { cookies } from 'next/headers';

export interface AuthenticatedUserResult {
  user: UserDocument;
  isNewUser: boolean;
  referralCode?: string;
  /** True if user doesn't have enough followers to sign */
  insufficientFollowers?: boolean;
}

export class AuthUserService {
  /**
   * Processes the complete authentication flow for a user:
   * 1. Creates or updates user record
   * 2. Handles referral code generation for new users
   * 3. Updates login tracking
   */
  static async processAuthenticatedUser(userData: {
    id: string;
    name: string;
    email?: string;
    image?: string;
    twitterData: TwitterUserData;
  }): Promise<AuthenticatedUserResult> {
    try {
      // Check if user already exists to determine if this is a new user
      const existingUser = await UserService.getUserByXId(userData.id);
      const isNewUser = !existingUser;

      // Create or update user record (now without referral logic)
      const user = await UserService.findOrCreateUser(userData);

      let referralCode: string | undefined;

      // Handle referral creation for new users only
      if (isNewUser) {
        // Check follower count requirement
        const followersCount = userData.twitterData.followers_count || 0;
        console.log(`👥 User @${userData.twitterData.username} has ${followersCount} followers (minimum required: ${MIN_FOLLOWERS_REQUIRED})`);

        if (followersCount < MIN_FOLLOWERS_REQUIRED) {
          console.warn(`⚠️ User @${userData.twitterData.username} does not meet minimum follower requirement (${followersCount} < ${MIN_FOLLOWERS_REQUIRED})`);
          // Update last login but don't create referral
          await UserService.updateLastLogin(userData.id);
          return {
            user,
            isNewUser,
            insufficientFollowers: true
          };
        }

        // Check for referral cookie
        let referredByCode: string | undefined;
        try {
          const cookieStore = await cookies();
          const refCookie = cookieStore.get('sentient_ref');
          console.log(`🔍 Checking for referral cookie... Found: ${!!refCookie}`);
          if (refCookie) {
            console.log(`🍪 Raw cookie value: ${refCookie.value.substring(0, 20)}...`);
            const refContext = ReferralCookieManager.decodeCookieValue(refCookie.value);
            console.log(`📝 Decoded context:`, refContext);
            if (refContext && ReferralCookieManager.isValidContext(refContext)) {
              referredByCode = refContext.referralCode;
              console.log(`✅ Found valid referral cookie: ${referredByCode}`);
            } else {
              console.warn(`⚠️ Invalid referral context or expired cookie`);
            }
          } else {
            console.log(`❌ No referral cookie found in cookie store`);
          }
        } catch (cookieError) {
          console.error('❌ Error reading referral cookie:', cookieError);
          // Continue without referral if cookie reading fails
        }

        referralCode = await ReferralCodeGenerator.createUserReferral({
          xId: userData.id,
          username: userData.twitterData.username,
          referredByCode
        });
      }

      // Update last login timestamp
      await UserService.updateLastLogin(userData.id);

      return {
        user,
        isNewUser,
        referralCode
      };

    } catch (error) {
      console.error('Error in processAuthenticatedUser:', error);
      throw new Error('Failed to process authenticated user');
    }
  }

  /**
   * Lightweight method for updating user data without referral logic
   */
  static async updateUserProfile(userData: {
    id: string;
    name: string;
    email?: string;
    image?: string;
    twitterData: TwitterUserData;
  }): Promise<UserDocument> {
    try {
      const user = await UserService.findOrCreateUser(userData);
      await UserService.updateLastLogin(userData.id);
      return user;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw new Error('Failed to update user profile');
    }
  }
}