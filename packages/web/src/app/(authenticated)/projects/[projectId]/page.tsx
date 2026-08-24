import { Container, Text, Title } from '@mantine/core';
import { notFound } from 'next/navigation';
import { getProjectMedia } from '@/features/media/service';
import { listProjects } from '@/features/projects/service';
import { MediaList } from '@/features/media/components/media-list';
export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const routeParameters = await params;
  const id = routeParameters.projectId;
  const [result, projects] = await Promise.all([getProjectMedia(id, 50, 0), listProjects('active')]);
  if (result === 'not_found') notFound();
  return (
    <Container>
      <Title order={1}>{result.project.name}</Title>
      {result.project.archivedAt && <Text c="orange">Archived</Text>}
      <MediaList media={result.data} projects={projects} allowInbox />
    </Container>
  );
}
