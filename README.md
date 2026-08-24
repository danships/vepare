# Initial project

This repository is a pnpm workspace containing the Next.js application in `packages/web` and the local media ingest client in `packages/media-ingest`.

## Prerequisites

- Node.js 24.x
- Corepack

```bash
corepack enable
pnpm install
pnpm dev
```

The web app is available at http://localhost:3000. Run `pnpm lint` for quality checks and `pnpm build` for a production build.

The ingest client requires Linux/WSL system tools (`ffmpeg`, `ffprobe`, SSH, and rsync). See [its README](packages/media-ingest/README.md) for configuration and operational guidance.
