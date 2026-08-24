import { z } from 'zod';
export const projectNameSchema = z.string().trim().min(1).max(100);
export const projectBodySchema = z.object({ name: projectNameSchema }).strict();
export const projectIdSchema = z.string().min(1).max(64);
export const projectStatusSchema = z.enum(['active', 'archived', 'all']).default('active');
