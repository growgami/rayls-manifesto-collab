import NextAuth from "next-auth";
import { authOptions } from "@/features/signing/modules/auth/lib/auth.lib";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };