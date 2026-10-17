import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, apiHandler, parseBody, requireUser } from "@/lib/api";
import { getTagUsage } from "@/lib/analytics";
import { tagInputSchema } from "@/lib/validation";

export const GET = apiHandler(async () => {
  const user = await requireUser();
  return NextResponse.json({ tags: await getTagUsage(user.id) });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const data = await parseBody(req, tagInputSchema, "Invalid tag");
  try {
    const tag = await prisma.tag.create({ data: { ...data, userId: user.id } });
    return NextResponse.json({ tag }, { status: 201 });
  } catch (err) {
    // P2002 = unique constraint (userId, name) violated
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ApiError(409, `You already have a tag called “${data.name}”`);
    }
    throw err;
  }
});
