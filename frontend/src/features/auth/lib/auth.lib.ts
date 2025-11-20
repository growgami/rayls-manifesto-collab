import { NextAuthOptions } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { TwitterUserData } from "@/features/auth/types/user.types";

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      authorization: {
        url: "https://twitter.com/i/oauth2/authorize",
        params: {
          scope: "users.read tweet.read offline.access",
          response_type: "code",
          code_challenge_method: "S256",
        },
      },
      token: "https://api.twitter.com/2/oauth2/token",
      userinfo: {
        url: "https://api.twitter.com/2/users/me",
        params: {
          "user.fields": "created_at,description,name,profile_image_url,public_metrics,url,username,verified",
        },
      },
      profile(profile) {
        const userData = profile.data;
        const twitterData: TwitterUserData = {
          created_at: userData.created_at || "",
          description: userData.description || "",
          id: userData.id,
          name: userData.name,
          profile_image_url: userData.profile_image_url || "",
          url: userData.url || "",
          username: userData.username,
        };

        return {
          id: userData.id,
          name: userData.name,
          email: undefined,
          image: userData.profile_image_url,
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
      if (user) {
        token.twitterData = user.twitterData;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.twitterData) {
        session.user.twitterData = token.twitterData as TwitterUserData;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
};

export const getServerSession = () => {
  // This will be used for server-side session access
  return null;
};