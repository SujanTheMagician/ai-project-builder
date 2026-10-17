import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { SIGNUP_CREDITS } from "@/lib/credits";

/**
 * Returns the database user for the signed-in Clerk user, creating or
 * syncing the record on demand. Returns null when nobody is signed in.
 * Wrapped in React's cache() so layouts and pages in one request share one lookup.
 */
export const getDbUser = cache(async () => {
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
    create: {
      clerkId: userId,
      email,
      name,
      imageUrl: clerkUser?.imageUrl ?? null,
      credits: SIGNUP_CREDITS,
      creditTransactions: { create: { amount: SIGNUP_CREDITS, reason: "signup_bonus" } },
    },
  });
});
