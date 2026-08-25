import { Anchor, Container, Group, List, Title } from '@mantine/core';
import Link from 'next/link';
import { ProjectFormModal } from '@/features/projects/components/project-form-modal';
import { listProjects } from '@/features/projects/service';
export default async function ProjectsPage() {
  const projects = await listProjects('active');
  return (
    <Container>
      <Group justify="space-between">
        <Title order={1}>Projects</Title>
        <ProjectFormModal />
      </Group>
      <List mt="md">
        {projects.map((project) => (
          <List.Item key={project.id}>
            <Anchor component={Link} href={`/projects/${project.id}`}>
              {project.name}
            </Anchor>
          </List.Item>
        ))}
      </List>
    </Container>
  );
}
