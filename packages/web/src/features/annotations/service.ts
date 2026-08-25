import { getFileAssetById } from '@/features/file-assets/repository';
import { getProjectById } from '@/features/projects/repository';
import { createClip, createMarker, getClip, getMarker, listAnnotations, updateClip, updateMarker } from './repository';

async function writable(mediaId: string) {
  const media = await getFileAssetById(mediaId);
  if (!media) return { kind: 'media_not_found' as const };
  const project = media.projectId ? await getProjectById(media.projectId) : null;
  if (!project || project.archivedAt) return { kind: 'inactive' as const };
  if (!media.durationMs || media.durationMs <= 0) return { kind: 'out_of_bounds' as const };
  return { kind: 'ok' as const, durationMs: media.durationMs };
}
export async function annotations(mediaId: string) {
  const media = await getFileAssetById(mediaId);
  return media ? listAnnotations(mediaId) : null;
}
export async function saveMarker(mediaId: string, timestampMs: number, note: string | null, markerId?: string) {
  const access = await writable(mediaId);
  if (access.kind !== 'ok') return access;
  if (timestampMs > access.durationMs) return { kind: 'out_of_bounds' as const };
  const now = new Date().toISOString();
  if (!markerId)
    return {
      kind: 'ok' as const,
      record: await createMarker({ mediaId, timestampMs, note, createdAt: now, updatedAt: now, deletedAt: null }),
    };
  const row = await getMarker(markerId);
  if (!row || row.mediaId !== mediaId || row.deletedAt) return { kind: 'annotation_not_found' as const };
  return { kind: 'ok' as const, record: await updateMarker({ ...row, timestampMs, note, updatedAt: now }) };
}
export async function saveClip(mediaId: string, inMs: number, outMs: number, clipId?: string) {
  const access = await writable(mediaId);
  if (access.kind !== 'ok') return access;
  if (inMs >= outMs || outMs > access.durationMs) return { kind: 'out_of_bounds' as const };
  const now = new Date().toISOString();
  if (!clipId)
    return {
      kind: 'ok' as const,
      record: await createClip({ mediaId, inMs, outMs, createdAt: now, updatedAt: now, deletedAt: null }),
    };
  const row = await getClip(clipId);
  if (!row || row.mediaId !== mediaId || row.deletedAt) return { kind: 'annotation_not_found' as const };
  return { kind: 'ok' as const, record: await updateClip({ ...row, inMs, outMs, updatedAt: now }) };
}
export async function deleteAnnotation(mediaId: string, id: string, type: 'marker' | 'clip') {
  const access = await writable(mediaId);
  if (access.kind !== 'ok') return access;
  if (type === 'marker') {
    const row = await getMarker(id);
    if (!row || row.mediaId !== mediaId || row.deletedAt) return { kind: 'annotation_not_found' as const };
    await updateMarker({ ...row, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  } else {
    const row = await getClip(id);
    if (!row || row.mediaId !== mediaId || row.deletedAt) return { kind: 'annotation_not_found' as const };
    await updateClip({ ...row, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  return { kind: 'ok' as const };
}
