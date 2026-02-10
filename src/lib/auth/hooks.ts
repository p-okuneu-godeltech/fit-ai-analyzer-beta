"use client";

import { signIn, signOut, useSession } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    status,
    session,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    signInWithGoogle: () => signIn('google'),
    signOut: () => signOut()
  };
}
