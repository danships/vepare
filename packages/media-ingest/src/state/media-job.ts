import { z } from 'zod';
import type { EntityDefinition } from 'supersave';
import { MediaMetadataSchema, SHA256_RE } from '../types.js';

export const JobStatusSchema = z.enum([
  'observing',
  'queued',
  'probing',
  'transcoding',
  'proxy_ready',
  'uploading',
  'uploaded',
  'duplicate',
  'unsupported',
  'failed',
]);
export type JobStatus = z.infer<typeof JobStatusSchema>;
export const MediaJobSchema = z
  .object({
    id: z.string().uuid(),
    sourcePath: z.string().min(1),
    sourceRelativePath: z.string().min(1),
    observedSizeBytes: z.number().int().safe().nonnegative(),
    observedMtimeMs: z.number().safe().nonnegative(),
    stableSinceMs: z.number().safe().nonnegative().nullable(),
    mediaId: z.string().regex(SHA256_RE).nullable(),
    sourceSha256: z.string().regex(SHA256_RE).nullable(),
    kind: z.enum(['video', 'audio']).nullable(),
    status: JobStatusSchema,
    resumeStatus: z.enum(['queued', 'proxy_ready']).nullable(),
    sourceMetadata: MediaMetadataSchema.nullable(),
    proxyPath: z.string().nullable(),
    manifestPath: z.string().nullable(),
    proxySha256: z.string().regex(SHA256_RE).nullable(),
    probeAttempts: z.number().int().nonnegative(),
    transcodeAttempts: z.number().int().nonnegative(),
    uploadAttempts: z.number().int().nonnegative(),
    nextAttemptAtMs: z.number().safe().nonnegative().nullable(),
    failureStage: z.enum(['stability', 'probe', 'hash', 'transcode', 'verify', 'upload']).nullable(),
    lastError: z.string().max(8192).nullable(),
    createdAtMs: z.number().safe().nonnegative(),
    updatedAtMs: z.number().safe().nonnegative(),
    uploadedAtMs: z.number().safe().nonnegative().nullable(),
  })
  .strict();
export type MediaJob = z.infer<typeof MediaJobSchema>;
export const newMediaJob = (
  input: Pick<MediaJob, 'id' | 'sourcePath' | 'sourceRelativePath' | 'observedSizeBytes' | 'observedMtimeMs'>,
  now = Date.now()
): MediaJob => ({
  ...input,
  stableSinceMs: now,
  mediaId: null,
  sourceSha256: null,
  kind: null,
  status: 'observing',
  resumeStatus: null,
  sourceMetadata: null,
  proxyPath: null,
  manifestPath: null,
  proxySha256: null,
  probeAttempts: 0,
  transcodeAttempts: 0,
  uploadAttempts: 0,
  nextAttemptAtMs: null,
  failureStage: null,
  lastError: null,
  createdAtMs: now,
  updatedAtMs: now,
  uploadedAtMs: null,
});
export const mediaJobEntity: EntityDefinition = {
  name: 'media-job',
  relations: [],
  template: newMediaJob(
    {
      id: '00000000-0000-4000-8000-000000000000',
      sourcePath: '',
      sourceRelativePath: '',
      observedSizeBytes: 0,
      observedMtimeMs: 0,
    },
    0
  ),
  filterSortFields: {
    sourcePath: 'string',
    mediaId: 'string',
    status: 'string',
    nextAttemptAtMs: 'number',
    updatedAtMs: 'number',
  },
};
