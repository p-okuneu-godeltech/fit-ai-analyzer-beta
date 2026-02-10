import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getEnv } from '@/lib/validation/env';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET } = getEnv();

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !NEXTAUTH_SECRET) {
  // In development we want a clear error early if auth is misconfigured.
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.warn(
      'NextAuth is not fully configured: GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/NEXTAUTH_SECRET are required for auth to work.'
    );
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID ?? '',
      clientSecret: GOOGLE_CLIENT_SECRET ?? ''
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.userId = token.sub ?? token.userId;
        token.email = token.email ?? (profile as { email?: string }).email;
        token.name = token.name ?? (profile as { name?: string }).name;
        token.picture = token.picture ?? (profile as { picture?: string }).picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string | undefined) ?? token.sub ?? '';
        if (token.email && !session.user.email) {
          session.user.email = token.email as string;
        }
        if (token.name && !session.user.name) {
          session.user.name = token.name as string;
        }
        if (token.picture && !session.user.image) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    }
  }
};

export type AuthOptions = typeof authOptions;
