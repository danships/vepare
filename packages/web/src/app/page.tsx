import { Button, Container, Stack, Text, Title } from '@mantine/core';

export default function Home() {
  return (
    <Container py="xl">
      <Stack gap="md">
        <Title>Initial project</Title>
        <Text>The web application is ready for development.</Text>
        <Button w="fit-content">Get started</Button>
      </Stack>
    </Container>
  );
}
