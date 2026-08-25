import { z } from 'zod';

export const mediaSummarySchema = z.object({
  id: z.string().length(32),
  originalName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  createdAt: z.string(),
  projectId: z.string().nullable(),
  durationMs: z.number().int().nonnegative().nullable(),
  videoFrameRateNumerator: z.number().int().positive().nullable(),
  videoFrameRateDenominator: z.number().int().positive().nullable(),
});

export const mediaPageSchema = z.object({
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export const mediaPageResponseSchema = z.object({
  data: z.array(mediaSummarySchema),
  page: mediaPageSchema,
});

export const mediaAssignmentResponseSchema = z.object({
  data: z.object({
    mediaIds: z.array(z.string().length(32)),
    projectId: z.string().min(1).max(64).nullable(),
    changedCount: z.number().int().nonnegative(),
  }),
});

export type MediaPageResponse = z.infer<typeof mediaPageResponseSchema>;
export type MediaAssignmentResponse = z.infer<typeof mediaAssignmentResponseSchema>;
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

export type MediaAssignmentRequest = z.infer<typeof assignmentSchema>;
