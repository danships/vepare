# AI Agent Instructions

## Project overview

This repository is a pnpm monorepo with one workspace: `packages/web` (`@repo/web`), a Next.js 16, React 19, Mantine 9, and TypeScript application. See [the web rules](packages/web/AGENTS.md) for package-specific guidance.

## Repository commands

- `pnpm dev` — start `@repo/web` in development mode
- `pnpm build` — create the production build
- `pnpm start` — serve the production build
- `pnpm lint` — run ESLint, Prettier, and TypeScript checks
- `pnpm lint:eslint`, `pnpm lint:prettier`, `pnpm lint:tsc` — run an individual check
- `pnpm format` — apply formatting fixes

Run `pnpm lint` and `pnpm build` after significant changes. Commit only when explicitly requested. Do not use dependency patches to work around lint or dependency issues; fix the underlying issue or configure the relevant rule deliberately.

## TypeScript and future APIs

- Prefer `type` aliases over `interface` declarations.
- Keep future API request and response contracts typed.
- Introduce runtime validation before API input reaches business logic.
- Mantine is the required UI component library; compose its components instead of recreating standard controls and layout primitives.
- Authentication and authorisation require an explicit future design. Do not introduce Better Auth unless a future ticket requires and designs it.

## Skills

| Skill | Path |
| --- | --- |
| `pnpm-workflow` | `.agents/skills/pnpm-workflow/SKILL.md` |
| `react-tsx-components` | `.agents/skills/react-tsx-components/SKILL.md` |
| `plan-feature` | `.agents/skills/plan-feature/SKILL.md` |
