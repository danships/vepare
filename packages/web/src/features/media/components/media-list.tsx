'use client';
import { Alert, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { MediaSummary } from '@/features/file-assets/types';
import type { ProjectResponse } from '@/features/projects/types';
import { assignMediaClient } from '../client';
import { MediaAssignmentBar } from './media-assignment-bar';
import { MediaTable } from './media-table';
export function MediaList({
  media,
  projects,
  allowInbox = true,
}: {
  media: MediaSummary[];
  projects: ProjectResponse[];
  allowInbox?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const assign = async (projectId: string | null) => {
    try {
      setError(undefined);
      await assignMediaClient(selected, projectId);
      setSelected([]);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Assignment failed.');
    }
  };
  return (
    <>
      <MediaAssignmentBar ids={selected} projects={projects} onAssign={assign} allowInbox={allowInbox} />
      {error && <Alert color="red">{error}</Alert>}
      {media.length > 0 ? (
        <MediaTable media={media} selected={selected} onChange={setSelected} />
      ) : (
        <Text c="dimmed">No media found.</Text>
      )}
    </>
  );
}
