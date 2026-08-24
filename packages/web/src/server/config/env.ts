/* eslint-disable unicorn/prevent-abbreviations */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const scopes = ['file-assets:register'] as const;
const keySchema = z
  .object({ principal: z.string().min(1), key: z.string(), scopes: z.array(z.enum(scopes)).min(1) })
  .strict();

export type AssetPrincipal = z.infer<typeof keySchema>;
export type AppEnv = { databaseUrl: string; assetRoot: string; assetMaxBytes: number; apiKeys: AssetPrincipal[] };

export function getEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const production = source.NODE_ENV === 'production';
  const parsed = z
    .object({
      DATABASE_URL: z.string().min(1),
      ASSET_ROOT: z.string().min(1),
      ASSET_MAX_BYTES: z
        .string()
        .regex(/^\d+$/)
        .transform(Number)
        .refine(Number.isSafeInteger)
        .refine((v) => v > 0),
      ASSET_REGISTRY_API_KEYS: z.string().min(1),
    })
    .parse(source);
  const apiKeys = z.array(keySchema).parse(JSON.parse(parsed.ASSET_REGISTRY_API_KEYS));
  if (
    new Set(apiKeys.map((item) => item.principal)).size !== apiKeys.length ||
    new Set(apiKeys.map((item) => item.key)).size !== apiKeys.length ||
    apiKeys.some((item) => Buffer.byteLength(item.key) < 32)
  ) {
    throw new Error('Invalid asset registry API-key configuration.');
  }
  if (!(production ? parsed.DATABASE_URL.startsWith('mysql://') : parsed.DATABASE_URL.startsWith('sqlite://')))
    throw new Error('Invalid database URL for environment.');
  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const assetRoot = production ? parsed.ASSET_ROOT : path.resolve(packageRoot, parsed.ASSET_ROOT);
  if (production && !path.isAbsolute(assetRoot)) throw new Error('ASSET_ROOT must be absolute in production.');
  return { databaseUrl: parsed.DATABASE_URL, assetRoot, assetMaxBytes: parsed.ASSET_MAX_BYTES, apiKeys };
}
