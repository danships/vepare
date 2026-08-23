# Initial project instructions

This pnpm monorepo contains one workspace: `packages/web` (`@repo/web`). The Next.js App Router lives in `packages/web/src/app`; use its file-system conventions for pages, layouts, and route handlers.

Run root commands: `pnpm dev`, `pnpm lint`, and `pnpm build`. Configuration is at the repository root (`package.json`, `.prettierrc`, `pnpm-workspace.yaml`) and in `packages/web` (`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`).

Mantine is the default UI library. Prefer composed Mantine components over rebuilding standard UI in CSS. Prefer TypeScript `type` aliases over interfaces. Always run `pnpm lint` and `pnpm build` after significant changes.

The authoritative guidance is [AGENTS.md](../AGENTS.md) and [packages/web/AGENTS.md](../packages/web/AGENTS.md).
