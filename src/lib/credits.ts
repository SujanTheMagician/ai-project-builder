import "server-only";
import type { CreditReason } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";

export const SIGNUP_CREDITS = 500;

export const CREDIT_COSTS = {
  blueprint_generation: 10,
  section_regeneration: 3,
} as const;

type SpendReason = keyof typeof CREDIT_COSTS;

/**
 * Atomically deducts credits and writes the ledger row. The conditional
 * updateMany means two parallel requests can never drive the balance negative.
 */
export async function spendCredits(userId: string, reason: SpendReason, projectId?: string) {
  const amount = CREDIT_COSTS[reason];
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id: userId, credits: { gte: amount } },
      data: { credits: { decrement: amount } },
    });
    if (count === 0) {
      throw new ApiError(402, `Not enough AI credits. This action costs ${amount} credits.`);
    }
    await tx.creditTransaction.create({ data: { userId, amount: -amount, reason, projectId } });
  });
  return amount;
}

/** Gives back credits for a failed AI call. */
export async function refundCredits(userId: string, amount: number, projectId?: string) {
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { credits: { increment: amount } } }),
    prisma.creditTransaction.create({ data: { userId, amount, reason: "refund" satisfies CreditReason, projectId } }),
  ]);
}

/** Runs an AI task with credits reserved up front and refunded if the task throws. */
export async function withCredits<T>(userId: string, reason: SpendReason, projectId: string | undefined, task: () => Promise<T>): Promise<T> {
  const amount = await spendCredits(userId, reason, projectId);
  try {
    return await task();
  } catch (err) {
    await refundCredits(userId, amount, projectId).catch((e) => console.error("Credit refund failed:", e));
    throw err;
  }
}
