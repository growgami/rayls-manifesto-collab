import { UserService, UserDocument } from '@/features/signing/modules/auth/utils/userDb.util';
import { ReferralCodeGenerator } from '@/features/signing/modules/referral/services/referralGenerator.service';
import { TwitterUserData } from '@/features/signing/modules/auth/types/user.types';

export interface AuthenticatedUserResult {
  user: UserDocument;
  isNewUser: boolean;
  referralCode?: string;
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
        referralCode = await ReferralCodeGenerator.createUserReferral({
          xId: userData.id,
          username: userData.twitterData.username
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