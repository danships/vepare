import { z } from 'zod';

const ms = z.number().int().safe().nonnegative();
const note = z
  .string()
  .max(2000)
  .nullable()
  .transform((value) => value?.trim() || null);
export const markerBodySchema = z.object({ timestampMs: ms, note: note.optional().default(null) }).strict();
export const markerUpdateSchema = z.object({ timestampMs: ms, note }).strict();
export const clipBodySchema = z
  .object({ inMs: ms, outMs: z.number().int().safe().positive() })
  .strict()
  .refine((v) => v.inMs < v.outMs, { message: 'Out point must be after in point.' });
export const routeIdSchema = z.string().min(1).max(64);
