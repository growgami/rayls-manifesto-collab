import NextAuth from "next-auth";
import { TwitterUserData } from "./user.types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
      twitterData?: TwitterUserData;
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
  }
}