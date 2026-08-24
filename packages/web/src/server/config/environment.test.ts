import { describe, expect, it } from 'vitest';
import { getEnv as getEnvironment } from './env';

const environment = (apiKeys: string): NodeJS.ProcessEnv => ({
  NODE_ENV: 'test',
  DATABASE_URL: 'sqlite://:memory:',
  ASSET_ROOT: '.data',
  ASSET_MAX_BYTES: '1',
  ASSET_REGISTRY_API_KEYS: apiKeys,
});

describe('getEnvironment', () => {
  it('redacts malformed API-key configuration values', () => {
    const secret = 'secret-api-key-value';
    expect(() => getEnvironment(environment(`{\"key\":\"${secret}`))).toThrowError(
      'Invalid asset registry API-key configuration.'
    );
    try {
      getEnvironment(environment(`{\"key\":\"${secret}`));
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toContain(secret);
    }
  });

  it('redacts invalid API-key entry values', () => {
    const secret = 'secret-api-key-value';
    expect(() =>
      getEnvironment(environment(`[{\"principal\":\"user\",\"key\":\"${secret}\",\"scopes\":[]}]`))
    ).toThrowError('Invalid asset registry API-key configuration.');
  });
});
