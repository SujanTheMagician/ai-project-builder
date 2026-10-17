import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiHandler, requireUser } from "@/lib/api";
import { getCreditActivity, getDailyCreditUsage } from "@/lib/analytics";

const PAGE_SIZE = 15;

/** Paginated credit ledger plus a 14-day usage series. */
export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);

  const [transactions, total, daily] = await Promise.all([
    getCreditActivity(user.id, { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    prisma.creditTransaction.count({ where: { userId: user.id } }),
    getDailyCreditUsage(user.id),
  ]);

  return NextResponse.json({
    balance: user.credits,
    transactions,
    daily,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
});
