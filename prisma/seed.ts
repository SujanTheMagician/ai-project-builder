import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Idempotent backfill for databases created before the credit ledger existed:
 * every user without ledger rows gets one opening-balance row matching their
 * current credits, so SUM(credit_transactions.amount) = users.credits holds.
 * Also numbers legacy blueprint rows 1..n per project in creation order.
 */
async function main() {
  const usersWithoutLedger = await prisma.user.findMany({
    where: { creditTransactions: { none: {} } },
    select: { id: true, credits: true },
  });
  for (const u of usersWithoutLedger) {
    await prisma.creditTransaction.create({ data: { userId: u.id, amount: u.credits, reason: "admin_adjustment" } });
  }

  const renumbered = await prisma.$executeRaw`
    UPDATE documents d
    SET version = numbered.rn
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY "projectId", type ORDER BY "createdAt") AS rn
      FROM documents
    ) AS numbered
    WHERE d.id = numbered.id AND d.version <> numbered.rn`;

  console.log(`Backfilled ledger for ${usersWithoutLedger.length} user(s); renumbered ${renumbered} blueprint version(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
