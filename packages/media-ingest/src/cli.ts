#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { Command } from 'commander';
import { loadConfig } from './config.js';
import { doctorRemote } from './upload.js';
import { runCommand } from './process/command.js';
import { ensureWritable, runDaemon, runScan, withState } from './app.js';
import { openState } from './state/supersave.js';
import { MediaJobRepository } from './state/repository.js';

const program = new Command().name('media-ingest').version('0.1.0');
async function tools() {
  for (const executable of ['ffmpeg', 'ffprobe', 'rsync', 'ssh']) {
    const result = await runCommand({ executable, args: ['-version'], label: executable });
    if (result.exitCode !== 0) throw new Error(`${executable} is unavailable: ${result.stderr}`);
    console.log(result.stdout.split('\n', 1)[0]);
  }
}
program
  .command('doctor')
  .requiredOption('--config <path>')
  .action(async ({ config: file }) => {
    const config = await loadConfig(file);
    await ensureWritable(config.local.stateDirectory);
    await ensureWritable(config.local.workDirectory);
    await tools();
    await doctorRemote(config);
  });
program
  .command('run')
  .requiredOption('--config <path>')
  .option('--log-level <level>')
  .option('--json')
  .action(async ({ config: file, logLevel, json }) => {
    const config = await loadConfig(file);
    await runDaemon({ ...config, logLevel: logLevel ?? config.logLevel, jsonLogs: Boolean(json || config.jsonLogs) });
  });
program
  .command('scan')
  .requiredOption('--config <path>')
  .action(async ({ config: file }) => {
    if (await runScan(await loadConfig(file))) process.exitCode = 2;
  });
program
  .command('status')
  .requiredOption('--config <path>')
  .option('--json')
  .action(async ({ config: file, json }) => {
    const config = await loadConfig(file);
    const database = `${config.local.stateDirectory}/ingest.sqlite`;
    if (!existsSync(database)) {
      console.log(json ? '{}' : 'No ingest ledger yet.');
      return;
    }
    const state = await openState(config.local.stateDirectory, { skipSync: true });
    try {
      const jobs = new MediaJobRepository(state.mediaJobs);
      const all = await jobs.all();
      const output = {
        counts: Object.fromEntries(
          Object.entries(await jobs.summary()).map(([key, value]) => [key, value?.length ?? 0])
        ),
        jobs: all.filter((job) => !['uploaded', 'duplicate', 'unsupported'].includes(job.status)),
      };
      console.log(json ? JSON.stringify(output, null, 2) : JSON.stringify(output, null, 2));
    } finally {
      await state.superSave.close();
    }
  });
program
  .command('retry')
  .requiredOption('--config <path>')
  .option('--media-id <sha256>')
  .option('--all-failed')
  .option('--stage <stage>')
  .action(async ({ config: file, mediaId, allFailed, stage }) => {
    if (Boolean(mediaId) === Boolean(allFailed)) throw new Error('provide exactly one of --media-id or --all-failed');
    if (stage && !['transcode', 'upload'].includes(stage)) throw new Error('--stage must be transcode or upload');
    const config = await loadConfig(file);
    await withState(config, async (jobs) => {
      for (const job of await jobs.all())
        if (job.status === 'failed' && (allFailed || job.mediaId === mediaId) && (!stage || job.failureStage === stage))
          await jobs.update({
            ...job,
            status: job.resumeStatus ?? 'queued',
            resumeStatus: null,
            nextAttemptAtMs: null,
            lastError: null,
            failureStage: null,
            transcodeAttempts: stage === 'transcode' ? 0 : job.transcodeAttempts,
            uploadAttempts: stage === 'upload' ? 0 : job.uploadAttempts,
          });
    });
  });
program.parseAsync().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
