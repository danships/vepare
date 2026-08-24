import { z } from 'zod';

export const SUPPORTED_SOURCE_EXTENSIONS = new Set(['.mp4', '.m4a', '.mp3']);
export const SHA256_RE = /^[a-f0-9]{64}$/;
const finiteSeconds = z.number().finite().nonnegative();
const bytes = z.number().int().safe().nonnegative();

export const StreamSchema = z
  .object({
    index: z.number().int().nonnegative(),
    type: z.enum(['video', 'audio']),
    selected: z.boolean(),
    codec: z.string().min(1),
    timeBase: z.string().nullable(),
    startTimeSeconds: finiteSeconds.nullable(),
    durationSeconds: finiteSeconds.nullable(),
    width: z.number().int().positive().nullable().optional(),
    height: z.number().int().positive().nullable().optional(),
    pixelFormat: z.string().nullable().optional(),
    rotationDegrees: z.number().finite().nullable().optional(),
    rFrameRate: z.string().nullable().optional(),
    averageFrameRate: z.string().nullable().optional(),
    sampleRateHz: z.number().int().positive().nullable().optional(),
    channels: z.number().int().positive().nullable().optional(),
    channelLayout: z.string().nullable().optional(),
  })
  .strict();
export type NormalizedStream = z.infer<typeof StreamSchema>;
export const MediaMetadataSchema = z
  .object({
    container: z.string().nullable(),
    durationSeconds: finiteSeconds,
    startTimeSeconds: finiteSeconds.nullable(),
    creationTime: z.string().nullable(),
    timecode: z.string().nullable(),
    streams: z.array(StreamSchema),
  })
  .strict();
export type NormalizedMediaMetadata = z.infer<typeof MediaMetadataSchema>;

export const MediaManifestV1Schema = z
  .object({
    schemaVersion: z.literal(1),
    mediaId: z.string().regex(SHA256_RE),
    kind: z.enum(['video', 'audio']),
    source: z
      .object({
        fileName: z.string(),
        relativePath: z.string(),
        sizeBytes: bytes,
        sha256: z.string().regex(SHA256_RE),
        mtime: z.string(),
        container: z.string().nullable(),
        durationSeconds: finiteSeconds,
        startTimeSeconds: finiteSeconds.nullable(),
        creationTime: z.string().nullable(),
        timecode: z.string().nullable(),
        streams: z.array(StreamSchema),
      })
      .strict(),
    proxy: z
      .object({
        fileName: z.enum(['proxy.mp4', 'proxy.m4a']),
        sizeBytes: bytes,
        sha256: z.string().regex(SHA256_RE),
        durationSeconds: finiteSeconds,
        timelineOrigin: z.literal('source-relative-zero'),
        streams: z.array(StreamSchema),
      })
      .strict(),
    createdAt: z.string().datetime(),
  })
  .strict();
export type MediaManifestV1 = z.infer<typeof MediaManifestV1Schema>;
export const ReadyMarkerV1Schema = z
  .object({
    schemaVersion: z.literal(1),
    mediaId: z.string().regex(SHA256_RE),
    manifestSha256: z.string().regex(SHA256_RE),
    proxySha256: z.string().regex(SHA256_RE),
    completedAt: z.string().datetime(),
  })
  .strict();
export type ReadyMarkerV1 = z.infer<typeof ReadyMarkerV1Schema>;
