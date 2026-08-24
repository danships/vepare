import { mkdir, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { sha256File } from './identity.js';
import { probeFile } from './probe.js';
import { buildTranscodeArgs, proxyPathFor, verifyProxy } from './transcode.js';
import { canonicalJson, sha256Text } from './manifest.js';
import { runCommand } from './process/command.js';
import { publish } from './upload.js';
import type { IngestConfig } from './config.js';
import type { MediaJob } from './state/media-job.js';
import { MediaJobRepository } from './state/repository.js';

const delays = [30_000, 120_000, 600_000, 1_800_000, 3_600_000];
export class Runner {
  constructor(
    private readonly config: IngestConfig,
    private readonly jobs: MediaJobRepository
  ) {}
  async observe(file: { sourcePath: string; sourceRelativePath: string; size: number; mtimeMs: number }) {
    return this.jobs.observe(file.sourcePath, file.sourceRelativePath, file.size, file.mtimeMs);
  }
  async settle(now = Date.now()) {
    for (const job of await this.jobs.all())
      if (job.status === 'observing') {
        const info = await stat(job.sourcePath).catch(() => null);
        if (!info) await this.fail(job, 'stability', 'source file is missing', 1);
        else if (info.size !== job.observedSizeBytes || info.mtimeMs !== job.observedMtimeMs)
          await this.jobs.update({
            ...job,
            observedSizeBytes: info.size,
            observedMtimeMs: info.mtimeMs,
            stableSinceMs: now,
          });
        else if (job.stableSinceMs && now - job.stableSinceMs >= this.config.watch.settleSeconds * 1000)
          await this.jobs.transition(job.id, 'observing', { status: 'queued', stableSinceMs: job.stableSinceMs });
      }
  }
  async drain() {
    for (;;) {
      await this.settle();
      const [job] = await this.jobs.due();
      if (!job) return;
      await this.process(job);
    }
  }
  private async process(job: MediaJob) {
    if (job.status === 'queued') await this.createProxy(job);
    else if (job.status === 'proxy_ready') await this.upload(job);
  }
  private async createProxy(job: MediaJob) {
    try {
      await this.jobs.transition(job.id, 'queued', { status: 'probing' });
      const source = await probeFile(job.sourcePath);
      const digest = await sha256File(job.sourcePath, { size: job.observedSizeBytes, mtimeMs: job.observedMtimeMs });
      if (!digest) {
        await this.jobs.transition(job.id, 'probing', { status: 'observing', stableSinceMs: Date.now() });
        return;
      }
      const duplicate = (await this.jobs.byMediaId(digest)).find((item) => item.id !== job.id);
      if (duplicate) {
        await this.jobs.transition(job.id, 'probing', { mediaId: digest, sourceSha256: digest, status: 'duplicate' });
        return;
      }
      const finalPath = proxyPathFor(this.config.local.workDirectory, digest, source.kind);
      const part = `${finalPath}.part`;
      await mkdir(path.dirname(finalPath), { recursive: true, mode: 0o700 });
      await rm(part, { force: true });
      await this.jobs.transition(job.id, 'probing', {
        status: 'transcoding',
        mediaId: digest,
        sourceSha256: digest,
        kind: source.kind,
        sourceMetadata: source.metadata,
        transcodeAttempts: job.transcodeAttempts + 1,
      });
      const transcoded = await runCommand({
        executable: 'ffmpeg',
        args: buildTranscodeArgs(job.sourcePath, part, source.kind, this.config.proxy),
        label: 'ffmpeg',
      });
      if (transcoded.exitCode !== 0) throw new Error(transcoded.stderr || 'ffmpeg failed');
      const proxy = await probeFile(part);
      verifyProxy(source.kind, source.metadata, proxy.metadata);
      const proxySha = await sha256File(part);
      if (!proxySha) throw new Error('could not hash proxy');
      await rename(part, finalPath);
      const manifest = {
        schemaVersion: 1 as const,
        mediaId: digest,
        kind: source.kind,
        source: {
          fileName: path.basename(job.sourcePath),
          relativePath: job.sourceRelativePath,
          sizeBytes: job.observedSizeBytes,
          sha256: digest,
          mtime: new Date(job.observedMtimeMs).toISOString(),
          ...source.metadata,
        },
        proxy: {
          fileName: path.basename(finalPath) as 'proxy.mp4' | 'proxy.m4a',
          sizeBytes: (await stat(finalPath)).size,
          sha256: proxySha,
          durationSeconds: proxy.metadata.durationSeconds,
          timelineOrigin: 'source-relative-zero' as const,
          streams: proxy.metadata.streams,
        },
        createdAt: new Date().toISOString(),
      };
      const manifestText = canonicalJson(manifest);
      const manifestPath = path.join(path.dirname(finalPath), 'manifest.json');
      const readyPath = path.join(path.dirname(finalPath), 'ready.json');
      const ready = {
        schemaVersion: 1 as const,
        mediaId: digest,
        manifestSha256: sha256Text(manifestText),
        proxySha256: proxySha,
        completedAt: new Date().toISOString(),
      };
      await (await import('node:fs/promises')).writeFile(manifestPath, manifestText);
      await (await import('node:fs/promises')).writeFile(readyPath, canonicalJson(ready));
      await this.jobs.transition(job.id, 'transcoding', {
        status: 'proxy_ready',
        proxyPath: finalPath,
        manifestPath,
        proxySha256: proxySha,
        resumeStatus: null,
      });
    } catch (error) {
      await this.fail(job, 'transcode', (error as Error).message, this.config.retry.maxTranscodeAttempts);
    }
  }
  private async upload(job: MediaJob) {
    try {
      if (!job.mediaId || !job.proxyPath || !job.manifestPath || !job.proxySha256)
        throw new Error('incomplete proxy artifacts');
      await this.jobs.transition(job.id, 'proxy_ready', {
        status: 'uploading',
        uploadAttempts: job.uploadAttempts + 1,
      });
      const readyPath = path.join(path.dirname(job.proxyPath), 'ready.json');
      await publish(this.config, {
        mediaId: job.mediaId,
        proxyPath: job.proxyPath,
        manifestPath: job.manifestPath,
        readyPath,
        manifestSha256: sha256Text(await (await import('node:fs/promises')).readFile(job.manifestPath, 'utf8')),
        proxySha256: job.proxySha256,
      });
      await this.jobs.transition(job.id, 'uploading', {
        status: 'uploaded',
        uploadedAtMs: Date.now(),
        nextAttemptAtMs: null,
        lastError: null,
      });
    } catch (error) {
      await this.fail(job, 'upload', (error as Error).message, this.config.retry.maxUploadAttempts);
    }
  }
  private async fail(job: MediaJob, stage: 'stability' | 'transcode' | 'upload', error: string, max: number) {
    const current = await this.jobs.get(job.id);
    if (!current) return;
    const attempts = stage === 'upload' ? current.uploadAttempts : current.transcodeAttempts;
    const exhausted = attempts >= max;
    await this.jobs.update({
      ...current,
      status: exhausted ? 'failed' : stage === 'upload' ? 'proxy_ready' : 'queued',
      resumeStatus: stage === 'upload' ? 'proxy_ready' : 'queued',
      failureStage: stage,
      lastError: error.slice(0, 8192),
      nextAttemptAtMs: exhausted ? null : Date.now() + delays[Math.min(attempts, delays.length - 1)],
    });
  }
}
