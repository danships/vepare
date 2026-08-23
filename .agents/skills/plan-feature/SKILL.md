---
name: plan-feature
description: Use when asked to create a detailed implementation plan for this repository.
---

# Planning a feature

Read the affected files before planning. Produce an actionable Markdown plan that names files, routes, types, UI components, validation requirements, and quality checks. State genuine assumptions explicitly.

For web changes, identify the App Router paths in `packages/web/src/app`, use Mantine 9 composition for UI, and include `pnpm lint` and `pnpm build` as required verification. If a user-facing behaviour needs browser coverage, name only the relevant targeted browser tests; do not prescribe a full end-to-end suite by default.
