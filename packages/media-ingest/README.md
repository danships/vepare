# Local media ingest

`@repo/media-ingest` is a Linux/WSL daemon for publishing browser-review proxies once to an SSH destination. It needs Node 24, `ffmpeg`, `ffprobe`, OpenSSH, and `rsync` on `PATH`; it does not support native Windows or macOS.

Copy and edit `media-ingest.example.json`, then run:

```bash
pnpm ingest doctor --config ./media-ingest.json
pnpm ingest run --config ./media-ingest.json
pnpm ingest scan --config ./media-ingest.json
pnpm ingest status --config ./media-ingest.json --json
```

The state directory is a private SQLite publish ledger and must be retained and backed up. The work directory contains generated proxies and manifests. Uploads land under `remoteBasePath/media/<source-sha256>/`; `ready.json` is transferred last and is the only discovery marker. This is publish-once, not synchronization: remote moves or deletions are intentionally not repaired.

Use a dedicated, unprivileged SSH account with a pre-provisioned host key and a key restricted to the target directory. On WSL, ensure systemd user services are enabled before using a service such as:

```ini
[Service]
ExecStart=/usr/bin/pnpm --dir /path/to/repo ingest run --config /home/me/media-ingest.json
Restart=on-failure
```

Interrupted transcodes are rebuilt; interrupted rsync uploads resume from `.rsync-partial`. Use `retry --all-failed` or `retry --media-id <sha256>` after fixing an operational error.
