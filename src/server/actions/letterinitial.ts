'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';

export async function getUserInitial(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  console.log('DEBUG Clerk user:', user); // <-- Agrega esto para depurar
  if (!user?.firstName) return null;
  return String(user.firstName).charAt(0).toUpperCase();
}
