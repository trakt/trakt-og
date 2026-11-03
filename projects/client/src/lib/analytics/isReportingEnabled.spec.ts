import { describe, expect, it } from 'vitest';
import { isReportingEnabled } from './isReportingEnabled.ts';

describe('util: isReportingEnabled', () => {
  it('reports from a production build on og.trakt.tv', () => {
    expect(isReportingEnabled({ origin: 'https://og.trakt.tv', dev: false })).toBe(true);
  });

  it('never reports from the dev server', () => {
    expect(isReportingEnabled({ origin: 'https://og.trakt.tv', dev: true })).toBe(false);
  });

  it.each([
    'http://localhost:5173',
    'http://localhost:8787',
    'https://og-preview.trakt.workers.dev',
    'https://trakt.tv',
    'http://og.trakt.tv',
  ])('never reports from %s', (origin) => {
    expect(isReportingEnabled({ origin, dev: false })).toBe(false);
  });
});
