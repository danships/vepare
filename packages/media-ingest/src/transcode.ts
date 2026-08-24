import path from 'node:path';
import { type NormalizedMediaMetadata } from './types.js';

export type ProxyOptions = { maxLongEdge: number; videoCrf: number; videoPreset: string; audioBitrateKbps: number };
export function proxyExtension(kind: 'video' | 'audio') {
  return kind === 'video' ? '.mp4' : '.m4a';
}
export function buildTranscodeArgs(
  input: string,
  outputPart: string,
  kind: 'video' | 'audio',
  options: ProxyOptions
): string[] {
  const common = ['-nostdin', '-hide_banner', '-loglevel', 'warning', '-y', '-copyts', '-start_at_zero', '-i', input];
  return kind === 'video'
    ? [
        ...common,
        '-map',
        '0:v:0',
        '-map',
        '0:a:0?',
        '-fps_mode:v',
        'passthrough',
        '-vf',
        `scale=w='min(${options.maxLongEdge},iw)':h='min(${options.maxLongEdge},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`,
        '-c:v',
        'libx264',
        '-preset',
        options.videoPreset,
        '-crf',
        String(options.videoCrf),
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        `${options.audioBitrateKbps}k`,
        '-movflags',
        '+faststart',
        outputPart,
      ]
    : [...common, '-map', '0:a:0', '-c:a', 'aac', '-b:a', `${options.audioBitrateKbps}k`, '-ar', '48000', outputPart];
}
export function verifyProxy(kind: 'video' | 'audio', source: NormalizedMediaMetadata, proxy: NormalizedMediaMetadata) {
  const primary = proxy.streams.find((stream) => stream.type === kind);
  if (!primary || proxy.durationSeconds <= 0) throw new Error('proxy primary stream is missing or invalid');
  if (
    kind === 'video' &&
    (primary.codec !== 'h264' ||
      primary.pixelFormat !== 'yuv420p' ||
      (primary.width && primary.width > 1280) ||
      (primary.height && primary.height > 1280))
  )
    throw new Error('proxy video contract failed');
  if (kind === 'audio' && primary.codec !== 'aac') throw new Error('proxy audio contract failed');
  const frameRate = Number(
    (source.streams.find((s) => s.type === 'video')?.averageFrameRate || '0/1')
      .split('/')
      .reduce((a, b) => Number(a) / Number(b), 0)
  );
  const tolerance = kind === 'video' ? Math.max(0.1, 2 / (frameRate || 1)) : 0.15;
  if (Math.abs(source.durationSeconds - proxy.durationSeconds) > tolerance)
    throw new Error('proxy duration differs from source beyond tolerance');
}
export const proxyPathFor = (work: string, mediaId: string, kind: 'video' | 'audio') =>
  path.join(work, 'media', mediaId, `proxy${proxyExtension(kind)}`);
