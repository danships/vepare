import { z } from 'zod';
export const projectNameSchema = z.string().trim().min(1).max(100);
export const projectBodySchema = z.object({ name: projectNameSchema }).strict();
export const projectIdSchema = z.string().min(1).max(64);
export const projectStatusSchema = z.enum(['active', 'archived', 'all']).default('active');

export const projectResponseSchema = z.object({
  data: z.object({
    id: z.string().min(1).max(64),
    name: projectNameSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
    archivedAt: z.string().nullable(),
  }),
});

export type ProjectRequest = z.infer<typeof projectBodySchema>;
export type ProjectResponse = z.infer<typeof projectResponseSchema>;
