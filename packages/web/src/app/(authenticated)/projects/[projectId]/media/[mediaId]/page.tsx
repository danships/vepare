import { Container, Anchor, Text } from '@mantine/core';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFileAssetById } from '@/features/file-assets/repository';
import { annotations } from '@/features/annotations/service';
import { getProjectById } from '@/features/projects/repository';
import { MediaReview } from '@/features/review/components/media-review';
export default async function MediaReviewPage({ params }: { params: Promise<{ projectId: string; mediaId: string }> }) {
  const { projectId, mediaId } = await params;
  const [media, project, data] = await Promise.all([
    getFileAssetById(mediaId),
    getProjectById(projectId),
    annotations(mediaId),
  ]);
  if (!media || !project || !data || media.projectId !== projectId) notFound();
  return (
    <Container>
      <Anchor component={Link} href={`/projects/${projectId}`}>
        Back to {project.name}
      </Anchor>
      {media.durationMs ? (
        <MediaReview media={media} markers={data.markers} clips={data.clips} readOnly={Boolean(project.archivedAt)} />
      ) : (
        <Text>Playback metadata unavailable.</Text>
      )}
    </Container>
  );
}
