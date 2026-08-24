import { z } from 'zod';
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export const assignmentSchema = z
  .object({
    mediaIds: z
      .array(z.string().length(32))
      .min(1)
      .max(100)
      .refine((ids) => new Set(ids).size === ids.length, 'Media IDs must be unique.'),
    projectId: z.string().min(1).max(64).nullable(),
  })
  .strict();
