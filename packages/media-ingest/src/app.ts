import { access, mkdir } from 'node:fs/promises';
import lockfile from 'proper-lockfile';
import pino from 'pino';
import type { IngestConfig } from './config.js';
import { scan, candidate, watch } from './discovery.js';
import { Runner } from './runner.js';
import { MediaJobRepository } from './state/repository.js';
import { openState } from './state/supersave.js';

export async function withState<T>(config: IngestConfig, action: (jobs: MediaJobRepository) => Promise<T>) {
  await mkdir(config.local.stateDirectory, { recursive: true, mode: 0o700 });
  await mkdir(config.local.workDirectory, { recursive: true, mode: 0o700 });
  const release = await lockfile.lock(config.local.stateDirectory, { stale: 15_000, realpath: false });
  try {
    const state = await openState(config.local.stateDirectory);
    try {
      return await action(new MediaJobRepository(state.mediaJobs));
    } finally {
      await state.superSave.close();
    }
  } finally {
    await release();
  }
}
export async function runScan(config: IngestConfig) {
  return withState(config, async (jobs) => {
    await jobs.reconcile();
    const runner = new Runner(config, jobs);
    await scan(config.watch.directory, config.watch.recursive, async (file) => {
      const found = await candidate(config.watch.directory, file);
      if (found) await runner.observe(found);
    });
    await runner.drain();
    return (await jobs.all()).some(
      (job) => job.status === 'observing' || job.status === 'queued' || job.status === 'proxy_ready'
    );
  });
}
export async function runDaemon(config: IngestConfig) {
  const logger = pino({ level: config.logLevel });
  return withState(config, async (jobs) => {
    await jobs.reconcile();
    const runner = new Runner(config, jobs);
    const collect = async (file: string) => {
      const found = await candidate(config.watch.directory, file);
      if (found) await runner.observe(found);
    };
    await scan(config.watch.directory, config.watch.recursive, collect);
    await runner.drain();
    const watcher = watch(config.watch.directory, config.watch.recursive, (file) => {
      void collect(file)
        .then(() => runner.drain())
        .catch((error: Error) => logger.error(error));
    });
    const timer = setInterval(() => {
      void runner.drain().catch((error: Error) => logger.error(error));
    }, config.watch.pollIntervalSeconds * 1000);
    await new Promise<void>((resolve) => {
      const stop = () => resolve();
      process.once('SIGINT', stop);
      process.once('SIGTERM', stop);
    });
    clearInterval(timer);
    await watcher.close();
  });
}
export async function ensureWritable(directory: string) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await access(directory);
}
