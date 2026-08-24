import { Container, Title, Text } from '@mantine/core';
import { getInboxMedia } from '@/features/media/service';
import { listProjects } from '@/features/projects/service';
import { MediaList } from '@/features/media/components/media-list';
export default async function InboxPage() {
  const [media, projects] = await Promise.all([getInboxMedia(50, 0), listProjects('active')]);
  return (
    <Container>
      <Title order={1}>Inbox</Title>
      <Text c="dimmed" mb="md">
        Unassigned registered media.
      </Text>
      <MediaList media={media.data} projects={projects} />
    </Container>
  );
}
