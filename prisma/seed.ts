import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed complete — create your first user via Clerk sign-up.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
