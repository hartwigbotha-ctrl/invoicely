import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      businessId: string;
      role: string;
    } & DefaultSession["user"];
  }
}
