import { z } from 'zod';
import { getDatabase } from '@/server/db/supersave';
import type { ClipRecord, MarkerRecord } from './types';

const markerSchema = z
  .object({
    id: z.string().max(64),
    mediaId: z.string(),
    timestampMs: z.number().int().nonnegative(),
    note: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable(),
  })
  .strict();
const clipSchema = z
  .object({
    id: z.string().max(64),
    mediaId: z.string(),
    inMs: z.number().int().nonnegative(),
    outMs: z.number().int().positive(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable(),
  })
  .strict();
export async function listAnnotations(mediaId: string) {
  const { markers, clips } = await getDatabase();
  const [markerRows, clipRows] = await Promise.all([markers.getAll(), clips.getAll()]);
  return {
    markers: markerSchema
      .array()
      .parse(markerRows)
      .filter((x) => x.mediaId === mediaId && !x.deletedAt)
      .toSorted(
        (a, b) => a.timestampMs - b.timestampMs || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
      ),
    clips: clipSchema
      .array()
      .parse(clipRows)
      .filter((x) => x.mediaId === mediaId && !x.deletedAt)
      .toSorted(
        (a, b) =>
          a.inMs - b.inMs || a.outMs - b.outMs || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
      ),
  };
}
export async function getMarker(id: string) {
  const { markers } = await getDatabase();
  const row = await markers.getById(id);
  return row ? markerSchema.parse(row) : null;
}
export async function getClip(id: string) {
  const { clips } = await getDatabase();
  const row = await clips.getById(id);
  return row ? clipSchema.parse(row) : null;
}
export async function createMarker(value: Omit<MarkerRecord, 'id'>) {
  const { markers } = await getDatabase();
  return markerSchema.parse(await markers.create(value));
}
export async function createClip(value: Omit<ClipRecord, 'id'>) {
  const { clips } = await getDatabase();
  return clipSchema.parse(await clips.create(value));
}
export async function updateMarker(value: MarkerRecord) {
  const { markers } = await getDatabase();
  return markerSchema.parse(await markers.update(value));
}
export async function updateClip(value: ClipRecord) {
  const { clips } = await getDatabase();
  return clipSchema.parse(await clips.update(value));
}
