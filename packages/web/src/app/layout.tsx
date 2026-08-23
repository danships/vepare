import '@mantine/core/styles.css';
import './globals.css';

import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Initial project',
  description: 'A Next.js monorepo scaffold.',
};

type RootLayoutProperties = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProperties) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  );
}
