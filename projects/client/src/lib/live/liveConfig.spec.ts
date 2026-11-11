import { describe, expect, it } from 'vitest';
import { liveConfig } from './liveConfig.ts';

describe('liveConfig', () => {
  it('should read back what it wrote', () => {
    const headers = new Headers();
    liveConfig.write(headers, { apiKey: 'key', environment: 'https://apiz.trakt.tv' });

    expect(liveConfig.read(headers)).toEqual({ apiKey: 'key', environment: 'https://apiz.trakt.tv' });
  });

  it('should refuse missing settings or an API base that is not https or localhost', () => {
    expect(liveConfig.read(new Headers())).toBeNull();
    expect(liveConfig.read(new Headers({ 'x-og-live-key': 'key', 'x-og-live-api': 'http://evil.test' }))).toBeNull();
  });
});
