import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, apiHandler, parseBody, requireUser } from "@/lib/api";
import { blueprintSchema } from "@/lib/ai/schema";
import { getLatestBlueprint, saveBlueprintVersion } from "@/services/blueprints";

type Context = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  patch: blueprintSchema.partial().strict(),
  note: z.string().trim().max(200).optional(),
});

/** Saves a manual edit (any subset of blueprint fields) as a new version. Free. */
export const PUT = apiHandler<Context>(async (req: NextRequest, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const { patch, note } = await parseBody(req, bodySchema, "Invalid blueprint edit");

  const project = await prisma.project.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!project) throw new ApiError(404, "Project not found");
  const latest = await getLatestBlueprint(id);
  if (!latest?.blueprint) throw new ApiError(400, "There is no blueprint to edit yet");

  const blueprint = { ...latest.blueprint, ...patch };
  const fields = Object.keys(patch);
  const doc = await saveBlueprintVersion(id, blueprint, { source: "manual_edit", note: note || `Edited ${fields.join(", ")}` });

  return NextResponse.json({ blueprint, version: doc.version });
});
