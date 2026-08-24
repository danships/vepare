import type { ReactNode } from 'react';

import { requireAuthentication } from '@/lib/auth';

type AuthenticatedLayoutProperties = Readonly<{
  children: ReactNode;
}>;

export default async function AuthenticatedLayout({ children }: AuthenticatedLayoutProperties) {
  await requireAuthentication();

  return children;
}
