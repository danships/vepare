import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

const localPath = z
  .string()
  .min(1)
  .refine((value) => !/[\0\n\r]/.test(value), 'must not contain NUL or newline');
const preset = z.enum(['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium']);
const ConfigSchema = z
  .object({
    version: z.literal(1),
    watch: z
      .object({
        directory: localPath,
        recursive: z.boolean().default(true),
        settleSeconds: z.number().int().min(5).max(3600).default(30),
        pollIntervalSeconds: z.number().int().min(1).max(3600).default(5),
      })
      .strict(),
    local: z.object({ stateDirectory: localPath, workDirectory: localPath }).strict(),
    proxy: z
      .object({
        maxLongEdge: z.number().int().min(320).max(3840).default(1280),
        videoCrf: z.number().int().min(18).max(40).default(28),
        videoPreset: preset.default('veryfast'),
        audioBitrateKbps: z.number().int().min(32).max(512).default(128),
      })
      .strict(),
    upload: z
      .object({
        destination: z.string().regex(/^[^@\s]+@[^@\s]+$/, 'must be user@host'),
        port: z.number().int().min(1).max(65_535).default(22),
        identityFile: localPath,
        remoteBasePath: z
          .string()
          .regex(/^\/[A-Za-z0-9/._-]*$/, 'must be a safe absolute POSIX path')
          .refine((v) => !v.split('/').includes('..'), 'must not contain ..'),
        connectTimeoutSeconds: z.number().int().min(1).max(300).default(15),
      })
      .strict(),
    retry: z
      .object({
        maxProbeAttempts: z.number().int().min(1).max(100).default(3),
        maxTranscodeAttempts: z.number().int().min(1).max(100).default(3),
        maxUploadAttempts: z.number().int().min(1).max(100).default(8),
      })
      .strict(),
    logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    jsonLogs: z.boolean().default(false),
  })
  .strict();
export type IngestConfig = z.infer<typeof ConfigSchema>;

const resolveLocal = (base: string, value: string) => path.resolve(base, value);
export async function loadConfig(file: string): Promise<IngestConfig> {
  const absolute = path.resolve(file);
  const base = path.dirname(absolute);
  let input: unknown;
  try {
    input = JSON.parse(await readFile(absolute, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read configuration: ${(error as Error).message}`);
  }
  const parsed = ConfigSchema.parse(input);
  const config = {
    ...parsed,
    watch: { ...parsed.watch, directory: resolveLocal(base, parsed.watch.directory) },
    local: {
      stateDirectory: resolveLocal(base, parsed.local.stateDirectory),
      workDirectory: resolveLocal(base, parsed.local.workDirectory),
    },
    upload: { ...parsed.upload, identityFile: resolveLocal(base, parsed.upload.identityFile) },
  };
  const watch = await stat(config.watch.directory).catch(() => {});
  if (!watch?.isDirectory()) throw new Error('watch.directory must exist and be a directory');
  const root = await realpath(config.watch.directory);
  const state = path.resolve(config.local.stateDirectory);
  const work = path.resolve(config.local.workDirectory);
  if (
    state === root ||
    state.startsWith(`${root}${path.sep}`) ||
    work === root ||
    work.startsWith(`${root}${path.sep}`)
  )
    throw new Error('stateDirectory and workDirectory must not be inside watch.directory');
  return config;
}
export { ConfigSchema };
