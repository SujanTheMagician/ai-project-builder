import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Reporting queries written as raw SQL so the JOINs are explicit.
 * $queryRaw with a tagged template sends every ${value} as a bound parameter,
 * so user input never gets concatenated into the SQL string.
 *
 * Prisma keeps camelCase field names as column names, hence the quoted identifiers.
 */

export type CategoryRow = { category: string; projects: number; versions: number };

/** Projects per category, plus how many blueprint versions they hold (LEFT JOIN keeps drafts). */
export function getCategoryBreakdown(userId: string) {
  return prisma.$queryRaw<CategoryRow[]>`
    SELECT p.category,
           COUNT(DISTINCT p.id)::int AS projects,
           COUNT(d.id)::int          AS versions
    FROM projects p
    LEFT JOIN documents d ON d."projectId" = p.id AND d.type = 'blueprint'
    WHERE p."userId" = ${userId} AND p.status <> 'archived'
    GROUP BY p.category
    ORDER BY projects DESC, p.category`;
}

export type DailyUsageRow = { day: string; spent: number };

/** Net credits spent (refunds subtracted) per day for the last `days` days, zero-filled via series LEFT JOIN ledger. */
export function getDailyCreditUsage(userId: string, days = 14) {
  return prisma.$queryRaw<DailyUsageRow[]>`
    SELECT to_char(g.day, 'YYYY-MM-DD') AS day,
           COALESCE(-SUM(ct.amount) FILTER (WHERE ct.reason IN ('blueprint_generation', 'section_regeneration', 'refund')), 0)::int AS spent
    FROM generate_series(CURRENT_DATE - ${days - 1}::int, CURRENT_DATE, interval '1 day') AS g(day)
    LEFT JOIN credit_transactions ct
           ON ct."userId" = ${userId}
          AND ct."createdAt"::date = g.day::date
    GROUP BY g.day
    ORDER BY g.day`;
}

export type ActivityRow = {
  id: string;
  amount: number;
  reason: string;
  createdAt: Date;
  projectId: string | null;
  projectName: string | null;
};

/** Credit ledger joined to project names; deleted projects show as null (LEFT JOIN). */
export function getCreditActivity(userId: string, { limit = 10, offset = 0 } = {}) {
  return prisma.$queryRaw<ActivityRow[]>`
    SELECT ct.id, ct.amount, ct.reason::text AS reason, ct."createdAt",
           p.id AS "projectId", p.name AS "projectName"
    FROM credit_transactions ct
    LEFT JOIN projects p ON p.id = ct."projectId"
    WHERE ct."userId" = ${userId}
    ORDER BY ct."createdAt" DESC
    LIMIT ${limit} OFFSET ${offset}`;
}

export type TagUsageRow = { id: string; name: string; color: string; projects: number };

/** Every tag with the number of projects using it, via the project_tags junction table. */
export function getTagUsage(userId: string) {
  return prisma.$queryRaw<TagUsageRow[]>`
    SELECT t.id, t.name, t.color, COUNT(pt."projectId")::int AS projects
    FROM tags t
    LEFT JOIN project_tags pt ON pt."tagId" = t.id
    WHERE t."userId" = ${userId}
    GROUP BY t.id
    ORDER BY projects DESC, t.name`;
}

export type PendingProjectRow = { id: string; name: string; category: string; createdAt: Date };

/** Anti-join: projects that have no blueprint yet. */
export function getProjectsWithoutBlueprint(userId: string) {
  return prisma.$queryRaw<PendingProjectRow[]>`
    SELECT p.id, p.name, p.category, p."createdAt"
    FROM projects p
    LEFT JOIN documents d ON d."projectId" = p.id AND d.type = 'blueprint'
    WHERE p."userId" = ${userId} AND p.status <> 'archived' AND d.id IS NULL
    ORDER BY p."createdAt" DESC
    LIMIT 5`;
}

export type OverviewRow = {
  projects: number;
  blueprints: number;
  versions: number;
  conversations: number;
  creditsSpent: number;
};

/** Headline numbers in one round trip, each from its own join against the user's projects. */
export async function getOverview(userId: string): Promise<OverviewRow> {
  const [row] = await prisma.$queryRaw<OverviewRow[]>`
    SELECT
      (SELECT COUNT(*)::int FROM projects p WHERE p."userId" = ${userId} AND p.status <> 'archived') AS projects,
      (SELECT COUNT(DISTINCT d."projectId")::int
         FROM documents d JOIN projects p ON p.id = d."projectId"
        WHERE p."userId" = ${userId} AND d.type = 'blueprint') AS blueprints,
      (SELECT COUNT(*)::int
         FROM documents d JOIN projects p ON p.id = d."projectId"
        WHERE p."userId" = ${userId}) AS versions,
      (SELECT COUNT(*)::int FROM conversations c WHERE c."userId" = ${userId}) AS conversations,
      (SELECT COALESCE(-SUM(ct.amount), 0)::int FROM credit_transactions ct
        WHERE ct."userId" = ${userId}
          AND ct.reason IN ('blueprint_generation', 'section_regeneration', 'refund')) AS "creditsSpent"`;
  return row;
}
