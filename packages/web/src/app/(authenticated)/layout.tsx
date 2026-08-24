import { AppShell, Group, NavLink, Title } from '@mantine/core';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { requireAuthentication } from '@/lib/auth';

type AuthenticatedLayoutProperties = Readonly<{
  children: ReactNode;
}>;

export default async function AuthenticatedLayout({ children }: AuthenticatedLayoutProperties) {
  await requireAuthentication();

  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 220, breakpoint: 'sm' }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md">
          <Title order={3}>Media workspace</Title>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="sm">
        <NavLink component={Link} href="/inbox" label="Inbox" />
        <NavLink component={Link} href="/projects" label="Projects" />
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
