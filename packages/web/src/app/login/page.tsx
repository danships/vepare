import { Container, Stack, Text, Title } from '@mantine/core';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { isAuthenticated } from '@/lib/auth';

import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default async function LoginPage() {
  if (await isAuthenticated()) redirect('/');

  return (
    <Container py="xl" size="xs">
      <Stack gap="md">
        <Title order={1}>Sign in</Title>
        <Text>Enter the preshared key to access the application.</Text>
        <LoginForm />
      </Stack>
    </Container>
  );
}
