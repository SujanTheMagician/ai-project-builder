import { z } from "zod";

export const PROJECT_STATUSES = ["draft", "generated", "archived"] as const;

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
  .extend({ status: z.enum(PROJECT_STATUSES) })
  .partial()
  .strict();

/** History is loaded from the database, so the client only sends the new message. */
export const chatRequestSchema = z.object({
  conversationId: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
  message: z.string().trim().min(1, "Message is empty").max(4000),
});

export const conversationCreateSchema = z.object({
  projectId: z.string().min(1).nullish(),
  title: z.string().trim().min(1).max(100).optional(),
});

export const conversationUpdateSchema = z.object({
  title: z.string().trim().min(1).max(100),
});

export const TAG_COLORS = ["violet", "blue", "green", "amber", "red", "pink", "cyan", "gray"] as const;

export const tagInputSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required").max(30),
  color: z.enum(TAG_COLORS).default("violet"),
});

export const projectTagsSchema = z.object({
  tagIds: z.array(z.string().min(1)).max(20),
});
