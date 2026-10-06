import { z } from "zod";

export const projectInputSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters").max(100),
  category: z.string().trim().min(1, "Please select a category").max(50),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(5000),
  audience: z.string().trim().max(500).optional(),
  features: z.string().trim().max(2000).optional(),
  budget: z.string().trim().max(100).optional(),
  timeline: z.string().trim().max(100).optional(),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;

/** Fields a user may change on an existing project. */
export const projectUpdateSchema = projectInputSchema
  .extend({ status: z.enum(["draft", "generated", "archived"]) })
  .partial()
  .strict();

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      })
    )
    .min(1)
    .max(50),
});
