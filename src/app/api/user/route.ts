import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { apiHandler, requireUser } from "@/lib/api";
import { ApiError } from "@/lib/errors";

export const GET = apiHandler(async () => {
  const user = await requireUser();
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, credits: user.credits } });
});

/** Permanently deletes the signed-in user's data and their Clerk account. */
export const DELETE = apiHandler(async () => {
  const { userId } = await auth();
  if (!userId) throw new ApiError(401, "Unauthorized");

  // Projects, documents, tags, conversations, share links and the credit ledger all cascade from the user row.
  await prisma.user.deleteMany({ where: { clerkId: userId } });

  const client = await clerkClient();
  await client.users.deleteUser(userId);

  return NextResponse.json({ success: true });
});
