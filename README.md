# Initial project

## Media organization

Registered media starts in the Inbox. Projects organize media by changing database metadata only: assigning, returning, and archiving never move, rename, or modify files under `ASSET_ROOT`. Production database runtime access requires `SELECT`, `INSERT`, and `UPDATE`; schema synchronization should be performed during a controlled deployment with temporary DDL rights. The runtime account must not receive filesystem write, database `DELETE`/`DROP`, or `FILE` privileges.

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

## Web authentication

The web application requires the server-only `AUTH_PRESHARED_KEY` environment variable for browser sign-in. Set a unique, randomly generated value that is 32–1,024 characters long and has at least 32 characters of entropy. Never use a `NEXT_PUBLIC_` prefix or expose this value in client configuration.

```text
AUTH_PRESHARED_KEY=<random-32-character-or-longer-secret>
```

Changing `AUTH_PRESHARED_KEY` immediately invalidates every existing browser session. Production must terminate HTTPS and rate-limit `POST /login` at the reverse proxy to 10 attempts per source IP per rolling minute, returning HTTP 429 before excess requests reach Next.js. This repository does not manage a deployment proxy; configure that rule in the hosting platform's deployment configuration.

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
