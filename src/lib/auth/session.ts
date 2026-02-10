import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
};

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
    image: session.user.image ?? null
  };
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('User is not authenticated');
  }

  return user;
}
