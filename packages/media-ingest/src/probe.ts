import { z } from 'zod';
import { runCommand } from './process/command.js';
import { type NormalizedMediaMetadata, type NormalizedStream, MediaMetadataSchema } from './types.js';

const RawSchema = z.object({
  format: z
    .object({
      format_name: z.string().optional(),
      duration: z.string().optional(),
      start_time: z.string().optional(),
      tags: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  streams: z.array(
    z
      .object({
        index: z.number(),
        codec_type: z.string(),
        codec_name: z.string().optional(),
        time_base: z.string().optional(),
        start_time: z.string().optional(),
        duration: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        pix_fmt: z.string().optional(),
        r_frame_rate: z.string().optional(),
        avg_frame_rate: z.string().optional(),
        sample_rate: z.string().optional(),
        channels: z.number().optional(),
        channel_layout: z.string().optional(),
        tags: z.record(z.string(), z.string()).optional(),
        side_data_list: z.array(z.object({ rotation: z.number().optional() }).passthrough()).optional(),
      })
      .passthrough()
  ),
});
const numberOrNull = (value: string | undefined) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
export async function probeFile(
  file: string,
  runner = runCommand
): Promise<{ kind: 'video' | 'audio'; metadata: NormalizedMediaMetadata }> {
  const result = await runner({
    executable: 'ffprobe',
    args: ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file],
    label: 'ffprobe',
  });
  if (result.exitCode !== 0 || result.stdout.length > 8 * 1024 * 1024)
    throw new Error(`ffprobe failed: ${result.stderr}`);
  const raw = RawSchema.parse(JSON.parse(result.stdout));
  const media = raw.streams.filter((s) => s.codec_type === 'video' || s.codec_type === 'audio');
  const videos = media.filter((s) => s.codec_type === 'video');
  const audios = media.filter((s) => s.codec_type === 'audio');
  if (!((videos.length === 1 && audios.length <= 1) || (videos.length === 0 && audios.length === 1)))
    throw new Error('unsupported stream layout');
  const selected = new Set([videos[0]?.index, audios[0]?.index]);
  const streams: NormalizedStream[] = media.map((stream) =>
    stream.codec_type === 'video'
      ? {
          index: stream.index,
          type: 'video',
          selected: selected.has(stream.index),
          codec: stream.codec_name || 'unknown',
          timeBase: stream.time_base || null,
          startTimeSeconds: numberOrNull(stream.start_time),
          durationSeconds: numberOrNull(stream.duration),
          width: stream.width ?? null,
          height: stream.height ?? null,
          pixelFormat: stream.pix_fmt ?? null,
          rotationDegrees: stream.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? null,
          rFrameRate: stream.r_frame_rate ?? null,
          averageFrameRate: stream.avg_frame_rate ?? null,
        }
      : {
          index: stream.index,
          type: 'audio',
          selected: selected.has(stream.index),
          codec: stream.codec_name || 'unknown',
          timeBase: stream.time_base || null,
          startTimeSeconds: numberOrNull(stream.start_time),
          durationSeconds: numberOrNull(stream.duration),
          sampleRateHz: numberOrNull(stream.sample_rate),
          channels: stream.channels ?? null,
          channelLayout: stream.channel_layout ?? null,
        }
  );
  const primary = videos[0] || audios[0]!;
  const metadata = MediaMetadataSchema.parse({
    container: raw.format?.format_name ?? null,
    durationSeconds: numberOrNull(raw.format?.duration) ?? numberOrNull(primary.duration) ?? 0,
    startTimeSeconds: numberOrNull(primary.start_time),
    creationTime: raw.format?.tags?.creation_time ?? null,
    timecode: primary.tags?.timecode ?? raw.format?.tags?.timecode ?? null,
    streams,
  });
  if (metadata.durationSeconds <= 0) throw new Error('media has no positive duration');
  return { kind: videos.length === 1 ? 'video' : 'audio', metadata };
}
