import { z } from 'zod';

const invalidPath = (value: string) => {
  if (Buffer.byteLength(value, 'utf8') > 1024) return false;
  if (!value || value.startsWith('/') || value.includes('\\') || value.includes('\0')) return false;
  if (/\p{Cc}/u.test(value) || value.includes('//') || value.endsWith('/')) return false;
  return value.split('/').every((part) => part && part !== '.' && part !== '..' && part !== '.rsync-partial');
};

export const registerFileAssetRequestSchema = z
  .object({
    relativePath: z.string().refine(invalidPath, {
      message: 'Path must be a normalized relative path beneath the asset root.',
    }),
  })
  .strict();
