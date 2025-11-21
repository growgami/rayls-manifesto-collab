import { getCollection, COLLECTIONS } from "@/shared/lib/mongodb.lib";
import { TwitterUserData } from "@/features/auth/types/user.types";
import { ReferralCodeGenerator } from "@/features/referral/services/referralGenerator.service";

export interface UserDocument {
  _id?: string;
  xId: string;
  username: string;
  displayName: string;
  profileImageUrl: string;
  followersCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  static async findOrCreateUser(userData: {
    id: string;
    name: string;
    email?: string;
    image?: string;
    twitterData: TwitterUserData;
  }): Promise<UserDocument> {
    try {
      const usersCollection = await getCollection(COLLECTIONS.USERS);

      const existingUser = await usersCollection.findOne({
        xId: userData.id
      }) as UserDocument | null;

      const now = new Date();

      // Ensure we have a valid profile image URL
      const profileImageUrl = userData.image && userData.image.startsWith('http')
        ? userData.image
        : userData.twitterData.profile_image_url || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';

      if (existingUser) {
        const updatedUser = await usersCollection.findOneAndUpdate(
          { xId: userData.id },
          {
            $set: {
              displayName: userData.name,
              username: userData.twitterData.username,
              profileImageUrl: profileImageUrl,
              updatedAt: now,
            }
          },
          { returnDocument: 'after' }
        );

        return updatedUser as UserDocument;
      } else {
        // Create the user
        const newUser: Omit<UserDocument, '_id'> = {
          xId: userData.id,
          username: userData.twitterData.username,
          displayName: userData.name,
          profileImageUrl: profileImageUrl,
          createdAt: now,
          updatedAt: now,
        };

        const result = await usersCollection.insertOne(newUser);

        // Create referral record using dedicated service
        await ReferralCodeGenerator.createUserReferral({
          xId: userData.id,
          username: userData.twitterData.username
        });

        return {
          _id: result.insertedId.toString(),
          ...newUser,
        };
      }
    } catch (error) {
      console.error('Error in findOrCreateUser:', error);
      throw new Error('Failed to save user to database');
    }
  }

  static async getUserByXId(xId: string): Promise<UserDocument | null> {
    try {
      const usersCollection = await getCollection(COLLECTIONS.USERS);
      const user = await usersCollection.findOne({
        xId
      }) as UserDocument | null;

      return user;
    } catch (error) {
      console.error('Error in getUserByXId:', error);
      return null;
    }
  }

  static async updateLastLogin(xId: string): Promise<void> {
    try {
      const usersCollection = await getCollection(COLLECTIONS.USERS);
      await usersCollection.updateOne(
        { xId },
        {
          $set: {
            updatedAt: new Date()
          }
        }
      );
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }
}