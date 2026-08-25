'use client';
import { Alert, Badge, Button, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { useRef, useState } from 'react';
import type { ClipResponse, MarkerResponse } from '@/features/annotations/types';
import type { MediaSummary } from '@/features/file-assets/types';
import { formatTimestamp, secondsToMs } from '../time';
type Properties = { media: MediaSummary; markers: MarkerResponse[]; clips: ClipResponse[]; readOnly: boolean };
async function request(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!response.ok) {
    const json = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(json?.error?.message ?? 'Request failed.');
  }
  return response.status === 204 ? null : response.json();
}
export function MediaReview({ media, markers: initialMarkers, clips: initialClips, readOnly }: Properties) {
  const video = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(0);
  const [markers, setMarkers] = useState(initialMarkers);
  const [clips, setClips] = useState(initialClips);
  const [inMs, setInMs] = useState<number | null>(null);
  const [outMs, setOutMs] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();
  const duration = media.durationMs ?? 0;
  const current = () => Math.min(duration, secondsToMs(video.current?.currentTime ?? 0));
  const createMarker = async () => {
    try {
      const data = await request(`/api/media/${media.id}/markers`, 'POST', { timestampMs: current(), note });
      setMarkers((value) => [...value, data.data].toSorted((a, b) => a.timestampMs - b.timestampMs));
      setNote('');
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Unable to create marker.');
    }
  };
  const createClip = async () => {
    if (inMs === null || outMs === null) return;
    try {
      const data = await request(`/api/media/${media.id}/clips`, 'POST', { inMs, outMs });
      setClips((value) => [...value, data.data].toSorted((a, b) => a.inMs - b.inMs));
      setInMs(null);
      setOutMs(null);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Unable to save clip.');
    }
  };
  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>{media.originalName}</Title>
        {readOnly && <Badge color="orange">Read only</Badge>}
      </Group>
      {error && <Alert color="red">{error}</Alert>}
      <video
        ref={video}
        src={`/api/media/${media.id}/content`}
        preload="metadata"
        playsInline
        style={{ maxWidth: '100%', background: '#111' }}
        onTimeUpdate={(event) => setTime(secondsToMs(event.currentTarget.currentTime))}
        onLoadedMetadata={(event) => setTime(secondsToMs(event.currentTarget.currentTime))}
      />
      <Group>
        <Button
          onClick={() =>
            video.current?.paused
              ? void video.current.play().catch(() => setError('Playback was blocked by the browser.'))
              : video.current?.pause()
          }
        >
          Play / pause
        </Button>
        <Button
          variant="light"
          onClick={() => {
            if (video.current) video.current.currentTime = Math.max(0, video.current.currentTime - 5);
          }}
        >
          -5 seconds
        </Button>
        <Button
          variant="light"
          onClick={() => {
            if (video.current) video.current.currentTime = Math.min(duration / 1000, video.current.currentTime + 5);
          }}
        >
          +5 seconds
        </Button>
        <Text>
          {formatTimestamp(time)} / {formatTimestamp(duration)}
        </Text>
      </Group>
      <input
        aria-label="Seek media"
        type="range"
        min="0"
        max={duration}
        value={time}
        onChange={(event) => {
          const next = Number(event.currentTarget.value);
          setTime(next);
          if (video.current) video.current.currentTime = next / 1000;
        }}
        style={{ width: '100%' }}
      />{' '}
      {!readOnly && (
        <Group align="end">
          <TextInput label="Marker note" value={note} onChange={(event) => setNote(event.currentTarget.value)} />
          <Button onClick={createMarker}>Add marker at {formatTimestamp(time)}</Button>
          <Button variant="light" onClick={() => setInMs(current())}>
            Set in
          </Button>
          <Button variant="light" onClick={() => setOutMs(current())}>
            Set out
          </Button>
          <Button disabled={inMs === null || outMs === null || inMs >= outMs} onClick={createClip}>
            Save clip
          </Button>
        </Group>
      )}
      <Group align="start" grow>
        <Stack>
          <Title order={3}>Markers</Title>
          {markers.map((marker) => (
            <Button
              key={marker.id}
              variant="subtle"
              justify="start"
              onClick={() => {
                if (video.current) video.current.currentTime = marker.timestampMs / 1000;
              }}
            >
              {formatTimestamp(marker.timestampMs)} {marker.note ?? ''}
            </Button>
          ))}
        </Stack>
        <Stack>
          <Title order={3}>Clips</Title>
          {clips.map((clip) => (
            <Button
              key={clip.id}
              variant="subtle"
              justify="start"
              onClick={() => {
                if (video.current) video.current.currentTime = clip.inMs / 1000;
              }}
            >
              {formatTimestamp(clip.inMs)} — {formatTimestamp(clip.outMs)}
            </Button>
          ))}
        </Stack>
      </Group>
    </Stack>
  );
}
