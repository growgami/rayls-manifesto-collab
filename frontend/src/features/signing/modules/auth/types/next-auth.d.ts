import { TwitterUserData } from "./user.types";
import { BlockchainType } from "@/features/signing/modules/wallet/types/wallet.types";

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
      wallet?: {
        walletAddress: string;
        blockchainType: BlockchainType;
        createdAt: Date;
      };
      referralData?: {
        referralCode: string;
        position: number;
        referralCount: number;
        linkVisits: number;
        isKOL: boolean;
      };
      position?: number;
      /** True if user doesn't have minimum followers to sign */
      insufficientFollowers?: boolean;
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
    wallet?: {
      walletAddress: string;
      blockchainType: BlockchainType;
      createdAt: Date;
    } | null;
    referralData?: {
      referralCode: string;
      position: number;
      referralCount: number;
      linkVisits: number;
      isKOL: boolean;
    } | null;
    position?: number;
    insufficientFollowers?: boolean;
  }
}