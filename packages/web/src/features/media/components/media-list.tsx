'use client';
import { Alert, Button, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { MediaSummary } from '@/features/file-assets/types';
import type { ProjectResponse } from '@/features/projects/types';
import type { MediaPageResponse } from '../contracts';
import { assignMediaClient, getMediaPageClient } from '../client';
import { MediaAssignmentBar } from './media-assignment-bar';
import { MediaTable } from './media-table';
export function MediaList({
  media,
  page,
  pageUrl,
  projects,
  allowInbox = true,
}: {
  media: MediaSummary[];
  page: MediaPageResponse['page'];
  pageUrl: string;
  projects: ProjectResponse[];
  allowInbox?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [additionalMedia, setAdditionalMedia] = useState<MediaSummary[]>([]);
  const [currentPage, setCurrentPage] = useState(page);
  const [loadingMore, setLoadingMore] = useState(false);

  const displayedMedia = [...media, ...additionalMedia];
  const assign = async (projectId: string | null) => {
    try {
      setError(undefined);
      await assignMediaClient({ mediaIds: selected, projectId });
      setSelected([]);
      setAdditionalMedia([]);
      setCurrentPage(page);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Assignment failed.');
    }
  };
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      setError(undefined);
      const result = await getMediaPageClient(pageUrl, currentPage.limit, currentPage.offset + currentPage.limit);
      setAdditionalMedia((current) => [...current, ...result.data]);
      setCurrentPage(result.page);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load more media.');
    } finally {
      setLoadingMore(false);
    }
  };
  return (
    <>
      <MediaAssignmentBar ids={selected} projects={projects} onAssign={assign} allowInbox={allowInbox} />
      {error && <Alert color="red">{error}</Alert>}
      {displayedMedia.length > 0 ? (
        <>
          <MediaTable media={displayedMedia} selected={selected} onChange={setSelected} />
          {currentPage.hasMore && (
            <Button mt="md" variant="light" loading={loadingMore} onClick={loadMore}>
              Load more
            </Button>
          )}
        </>
      ) : (
        <Text c="dimmed">No media found.</Text>
      )}
    </>
  );
}
