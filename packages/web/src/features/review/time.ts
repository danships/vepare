export const msToSeconds = (milliseconds: number) => milliseconds / 1000;
export const secondsToMs = (seconds: number) => Math.round(seconds * 1000);
export const formatTimestamp = (milliseconds: number) => {
  const safe = Math.max(0, Math.round(milliseconds));
  const hours = Math.floor(safe / 3_600_000);
  const minutes = Math.floor(safe / 60_000) % 60;
  const seconds = Math.floor(safe / 1000) % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(safe % 1000).padStart(3, '0')}`;
};
export function parseTimestamp(value: string) {
  const match = /^(\d+):(\d{2}):(\d{2})\.(\d{3})$/.exec(value);
  if (!match) return null;
  const [, h, m, s, ms] = match;
  if (+m > 59 || +s > 59) return null;
  const result = (+h * 3600 + +m * 60 + +s) * 1000 + +ms;
  return Number.isSafeInteger(result) ? result : null;
}
