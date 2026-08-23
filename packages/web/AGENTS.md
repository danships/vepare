# Web application rules

This is the `@repo/web` workspace at `packages/web`. Read the [root rules](../../AGENTS.md) first.

## Architecture

- Use Next.js App Router. Route files live in `packages/web/src/app`; page routes use `page.tsx`, layouts use `layout.tsx`, and route handlers use `route.ts`.
- Keep reusable UI in clearly named components beneath `src/` as the application grows. Prefer composition of Mantine components and props over raw CSS for standard layout, spacing, typography, and controls.
- `layout.tsx` is responsible for the Mantine stylesheet, `ColorSchemeScript`, `mantineHtmlProps`, and `MantineProvider`.

## TypeScript and route handlers

- Prefer `type` aliases to interfaces and keep strict TypeScript intact.
- When APIs are introduced, type request/response contracts, validate untrusted input at runtime, return appropriate HTTP statuses, and export handlers named for their HTTP methods.
- Authentication and authorisation must be explicitly designed before adding protected routes. Do not introduce Better Auth unless a future ticket requires and designs it.

## Quality gates

Run `pnpm lint` and `pnpm build` from the repository root after significant changes. Use `pnpm lint:tsc` to isolate compile failures and `pnpm format` to apply formatting. Do not add dependency patches as lint workarounds. Commit only when explicitly requested.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
