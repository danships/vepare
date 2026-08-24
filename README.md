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
## File asset registration

Copy files into the configured asset root with rsync before registering them. Local development uses SQLite:

```sh
cp .env.example .env
mkdir -p packages/web/.data/assets
pnpm dev
curl -X POST http://localhost:3000/api/file-assets \
  -H 'Authorization: Bearer <redacted-api-key>' \
  -H 'Content-Type: application/json' \
  --data '{"relativePath":"uploads/hero.png"}'
```

`DATABASE_URL` is `sqlite://` outside production and must be a MySQL DSN in production. Set `ASSET_ROOT`, `ASSET_MAX_BYTES`, and `ASSET_REGISTRY_API_KEYS` in the deployment secret store. Registered paths are immutable: replacing or moving a registered file requires a new path, because this endpoint has no mutation or deletion operation. See [asset registration operations](docs/asset-registration.md) for the production rsync workflow and backup responsibilities.
