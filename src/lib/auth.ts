import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Returns the database user for the signed-in Clerk user, creating or
 * syncing the record on demand. Returns null when nobody is signed in.
 */
export async function getDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    // Users who sign up with phone/username only have no email; keep the unique column unique.
    `${userId}@users.noreply.local`;
  const name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    clerkUser?.username ||
    null;

  // upsert guards against two concurrent first requests racing to create the row
  return prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: { clerkId: userId, email, name, imageUrl: clerkUser?.imageUrl ?? null },
  });
}

export const CREDITS_PER_GENERATION = 10;
