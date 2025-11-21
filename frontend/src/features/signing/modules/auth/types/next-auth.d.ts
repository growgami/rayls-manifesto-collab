import { TwitterUserData } from "./user.types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
      twitterData?: TwitterUserData;
      dbUserId?: string;
      isNewUser?: boolean;
      referralCode?: string;
      needsBackgroundProcessing?: boolean;
    };
  }

  interface User {
    id: string;
    name?: string;
    email?: string;
    image?: string;
    twitterData?: TwitterUserData;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    twitterData?: TwitterUserData;
    dbUserId?: string;
    isNewUser?: boolean;
    referralCode?: string;
    needsProcessing?: boolean;
    processingComplete?: boolean;
    tempUserId?: string;
    tempUserData?: {
      id: string;
      name: string;
      email?: string;
      image?: string;
      twitterData: TwitterUserData;
    };
  }
}