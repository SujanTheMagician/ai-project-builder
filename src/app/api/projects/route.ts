import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import { projectInputSchema } from "@/lib/validation";

export async function GET() {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { documents: true } } },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = projectInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid project details", issues: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: { ...parsed.data, userId: user.id, status: "draft" },
  });

  return NextResponse.json({ project }, { status: 201 });
}
