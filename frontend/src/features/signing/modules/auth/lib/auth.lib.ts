import { NextAuthOptions, getServerSession as nextAuthGetServerSession } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { TwitterUserData } from "@/features/signing/modules/auth/types/user.types";
import { AuthUserService } from "@/features/signing/services/signing.service";

/**
 * Upgrades Twitter profile image URL from low-res to original high-res
 * Removes _normal suffix to get the original resolution image
 */
const upgradeTwitterImageUrl = (url: string): string => {
  if (!url) return url;
  return url.replace(/_normal\.(jpg|jpeg|png|gif|webp)$/i, '.$1');
};

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      userinfo: {
        url: "https://api.twitter.com/2/users/me",
        params: {
          "user.fields": "created_at,description,name,profile_image_url,public_metrics,url,username,verified",
        },
      },
      profile(profile) {
        console.log(`[TWITTER-PROFILE] Processing profile for user: @${profile.data?.username}`);
        const userData = profile.data;
        const highResImageUrl = upgradeTwitterImageUrl(userData.profile_image_url || "");

        const twitterData: TwitterUserData = {
          created_at: userData.created_at || "",
          description: userData.description || "",
          id: userData.id,
          name: userData.name,
          profile_image_url: highResImageUrl,
          url: userData.url || "",
          username: userData.username,
        };

        return {
          id: userData.id,
          name: userData.name,
          email: undefined,
          image: highResImageUrl,
          twitterData,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in: process user data
      if (user) {
        try {
          const userData = {
            id: user.id!,
            name: user.name!,
            email: user.email,
            image: user.image,
            twitterData: user.twitterData as TwitterUserData,
          };

          // Add timeout protection to prevent OAuth callback delays
          const result = await Promise.race([
            AuthUserService.processAuthenticatedUser(userData),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Database operation timeout')), 3000)
            )
          ]);

          // Store successful results
          token.twitterData = userData.twitterData;
          token.dbUserId = result.user._id?.toString();
          token.isNewUser = result.isNewUser;
          token.referralCode = result.referralCode;
          token.processingComplete = true;
          token.needsProcessing = false;
        } catch (error) {
          console.error('Failed to process authenticated user during OAuth:', error);

          // Still allow authentication to succeed - defer processing
          token.twitterData = user.twitterData;
          token.tempUserId = user.id;
          token.tempUserData = {
            id: user.id!,
            name: user.name!,
            email: user.email,
            image: user.image,
            twitterData: user.twitterData as TwitterUserData,
          };
          token.needsProcessing = true;
          token.processingComplete = false;
        }
      }

      // Subsequent requests: retry deferred processing if needed
      else if (token.needsProcessing && token.tempUserData && !token.processingComplete) {
        try {
          const result = await Promise.race([
            AuthUserService.processAuthenticatedUser(token.tempUserData),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Deferred processing timeout')), 2000)
            )
          ]);

          // Update token - these changes WILL persist from jwt callback
          token.dbUserId = result.user._id?.toString();
          token.isNewUser = result.isNewUser;
          token.referralCode = result.referralCode;
          token.needsProcessing = false;
          token.processingComplete = true;
          delete token.tempUserData;
          delete token.tempUserId;
        } catch (error) {
          console.error('Failed deferred user processing:', error);
          // Keep needsProcessing true to retry on next request
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Always include Twitter data
      if (token.twitterData) {
        session.user.twitterData = token.twitterData as TwitterUserData;
      }

      // Transfer processed data to session
      if (token.processingComplete) {
        if (token.dbUserId) {
          session.user.dbUserId = token.dbUserId as string;
        }
        if (token.isNewUser !== undefined) {
          session.user.isNewUser = token.isNewUser as boolean;
        }
        if (token.referralCode) {
          session.user.referralCode = token.referralCode as string;
        }
      } else if (token.needsProcessing) {
        // Signal to client that background processing may be needed
        session.user.needsBackgroundProcessing = true;
      }

      return session;
    },
  },
  debug: process.env.NEXTAUTH_DEBUG === "true",
  // Cookie configuration for PKCE
  // NOTE: secure is disabled for IP-based development (no domain yet)
  // TODO: When moving to production domain, enable secure cookies
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false, // Disabled for IP-based auth (http://142.93.176.105)
      },
    },
    state: {
      name: "next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false, // Disabled for IP-based auth (http://142.93.176.105)
      },
    },
  },
};

export const getServerSession = () => nextAuthGetServerSession(authOptions);