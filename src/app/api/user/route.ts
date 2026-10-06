import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

export async function GET() {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, credits: user.credits } });
}

/** Permanently deletes the signed-in user's data and their Clerk account. */
export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Projects and documents cascade from the user row.
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (dbUser) {
    await prisma.$transaction([
      prisma.chatMessage.deleteMany({ where: { userId: { in: [dbUser.id, userId] } } }),
      prisma.user.delete({ where: { id: dbUser.id } }),
    ]);
  }

  const client = await clerkClient();
  await client.users.deleteUser(userId);

  return NextResponse.json({ success: true });
}
