import { bulkSetProjectId, listByProject, listInbox } from '@/features/file-assets/repository';
import type { MediaSummary } from '@/features/file-assets/types';
import { getProjectById } from '@/features/projects/repository';
const summary = ({
  id,
  originalName,
  mimeType,
  sizeBytes,
  createdAt,
  projectId,
  durationMs,
  videoFrameRateNumerator,
  videoFrameRateDenominator,
}: MediaSummary): MediaSummary => ({
  id,
  originalName,
  mimeType,
  sizeBytes,
  createdAt,
  projectId,
  durationMs,
  videoFrameRateNumerator,
  videoFrameRateDenominator,
});
export async function getInboxMedia(limit: number, offset: number) {
  const items = await listInbox({ limit: limit + 1, offset });
  return {
    data: items.slice(0, limit).map((item) => summary(item)),
    page: { limit, offset, hasMore: items.length > limit },
  };
}
export async function getProjectMedia(projectId: string, limit: number, offset: number) {
  const project = await getProjectById(projectId);
  if (!project) return 'not_found' as const;
  const items = await listByProject(projectId, { limit: limit + 1, offset });
  return {
    project,
    data: items.slice(0, limit).map((item) => summary(item)),
    page: { limit, offset, hasMore: items.length > limit },
  };
}
export async function assignMedia(mediaIds: string[], projectId: string | null) {
  if (projectId) {
    const project = await getProjectById(projectId);
    if (!project) return 'project_not_found' as const;
    if (project.archivedAt) return 'project_archived' as const;
  }
  try {
    return { changedCount: await bulkSetProjectId(mediaIds, projectId) };
  } catch (error) {
    if (error instanceof Error && error.message === 'MEDIA_NOT_FOUND') return 'media_not_found' as const;
    throw error;
  }
}
