import { describe, expect, it } from 'vitest';
import { registerFileAssetRequestSchema } from './contracts';

describe('registerFileAssetRequestSchema', () => {
  it('accepts a normalized nested Unicode path', () => {
    expect(registerFileAssetRequestSchema.parse({ relativePath: 'uploads/2026/éclair.png' }).relativePath).toBe(
      'uploads/2026/éclair.png'
    );
  });
  it.each([
    '',
    '/tmp/a',
    String.raw`a\b`,
    'a//b',
    'a/',
    './a',
    'a/../b',
    '.rsync-partial/a',
    'a/.rsync-partial/b',
    'a\0b',
    'a\nb',
  ])('rejects "%s"', (relativePath) => {
    expect(registerFileAssetRequestSchema.safeParse({ relativePath }).success).toBe(false);
  });
  it('rejects unknown fields and paths over 1024 bytes', () => {
    expect(registerFileAssetRequestSchema.safeParse({ relativePath: 'a', unexpected: true }).success).toBe(false);
    expect(registerFileAssetRequestSchema.safeParse({ relativePath: 'a'.repeat(1025) }).success).toBe(false);
  });
});
