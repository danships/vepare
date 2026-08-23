---
name: pnpm-workflow
description: Use when running scripts, installing packages, or managing dependencies in this pnpm workspace.
---

# pnpm workflow

Use pnpm 11.23.0 exclusively; do not use npm or yarn. Run dependency operations from the repository root so `pnpm-lock.yaml` remains the only lockfile.

```bash
corepack enable
pnpm install
pnpm add --filter @repo/web <package>
pnpm add --filter @repo/web -D <package>
```

| Task | Command |
| --- | --- |
| Development server | `pnpm dev` |
| Production build | `pnpm build` |
| Production server | `pnpm start` |
| All quality checks | `pnpm lint` |
| ESLint / Prettier / TypeScript | `pnpm lint:eslint` / `pnpm lint:prettier` / `pnpm lint:tsc` |
| Apply formatting | `pnpm format` |

Before a commit or pull request, run `pnpm lint` and `pnpm build`. The workspace definition is `packages/*`; `packages/web` is the only workspace and contains the Next.js 16 application.
