import path from 'node:path';
import { readFile } from 'node:fs/promises';
import type { IngestConfig } from './config.js';
import { ReadyMarkerV1Schema, type ReadyMarkerV1 } from './types.js';
import { runCommand } from './process/command.js';

export const quoteRemote = (value: string) => `'${value.replaceAll("'", String.raw`'\"'\"'`)}'`;
const sshOptions = (config: IngestConfig) => [
  '-p',
  String(config.upload.port),
  '-o',
  'BatchMode=yes',
  '-o',
  `ConnectTimeout=${config.upload.connectTimeoutSeconds}`,
  '-i',
  config.upload.identityFile,
];
export async function doctorRemote(config: IngestConfig, runner = runCommand) {
  const command = `mkdir -p -- ${quoteRemote(`${config.upload.remoteBasePath}/media`)}`;
  const result = await runner({
    executable: 'ssh',
    args: [...sshOptions(config), config.upload.destination, command],
    label: 'ssh preflight',
  });
  if (result.exitCode !== 0) throw new Error(result.stderr || 'SSH preflight failed');
}
export async function publish(
  config: IngestConfig,
  input: {
    mediaId: string;
    proxyPath: string;
    manifestPath: string;
    readyPath: string;
    manifestSha256: string;
    proxySha256: string;
  },
  runner = runCommand
) {
  const remoteDirectory = `${config.upload.remoteBasePath}/media/${input.mediaId}`;
  const remoteReady = `${remoteDirectory}/ready.json`;
  const check = await runner({
    executable: 'ssh',
    args: [
      ...sshOptions(config),
      config.upload.destination,
      `if test -f ${quoteRemote(remoteReady)}; then head -c 16384 ${quoteRemote(remoteReady)}; fi`,
    ],
    label: 'check remote marker',
  });
  if (check.exitCode !== 0) throw new Error(check.stderr || 'remote marker check failed');
  if (check.stdout.trim()) {
    const marker = ReadyMarkerV1Schema.parse(JSON.parse(check.stdout)) as ReadyMarkerV1;
    if (
      marker.mediaId === input.mediaId &&
      marker.manifestSha256 === input.manifestSha256 &&
      marker.proxySha256 === input.proxySha256
    )
      return;
    throw new Error('remote ready marker conflicts with local media');
  }
  const mkdir = await runner({
    executable: 'ssh',
    args: [...sshOptions(config), config.upload.destination, `mkdir -p -- ${quoteRemote(remoteDirectory)}`],
    label: 'create remote directory',
  });
  if (mkdir.exitCode !== 0) throw new Error(mkdir.stderr || 'remote mkdir failed');
  const transport = `ssh ${sshOptions(config).map(quoteRemote).join(' ')}`;
  const target = `${config.upload.destination}:${remoteDirectory}/`;
  const first = await runner({
    executable: 'rsync',
    args: [
      '--archive',
      '--partial-dir=.rsync-partial',
      '--delay-updates',
      '--protect-args',
      '-e',
      transport,
      input.proxyPath,
      input.manifestPath,
      target,
    ],
    label: 'upload proxy and manifest',
  });
  if (first.exitCode !== 0) throw new Error(first.stderr || 'rsync upload failed');
  const marker = await runner({
    executable: 'rsync',
    args: [
      '--archive',
      '--partial-dir=.rsync-partial',
      '--delay-updates',
      '--protect-args',
      '-e',
      transport,
      input.readyPath,
      target,
    ],
    label: 'upload ready marker',
  });
  if (marker.exitCode !== 0) throw new Error(marker.stderr || 'rsync marker upload failed');
}
export async function readReady(file: string) {
  return ReadyMarkerV1Schema.parse(JSON.parse(await readFile(path.resolve(file), 'utf8')));
}
