import { describe, expect, it } from 'vitest';
import { toReportTracking } from './toReportTracking.ts';

describe('toReportTracking', () => {
  it.each([
    ['comment', 'spoilers'],
    ['movie', 'data_refresh'],
    ['episode', 'tmdb'],
    ['person', 'metadata'],
    ['list', 'remove'],
    ['user', 'language'],
  ] as const)('should keep a %s report for %s', (type, reason) => {
    expect(toReportTracking({ type, reason, result: { ok: true } }).reason).toBe(reason);
  });

  it.each([
    ['comment', 'support'],
    ['comment', 'too_short'],
    ['comment', 'tmdb'],
    ['user', 'duplicate'],
    ['list', 'runtime'],
  ] as const)('should send a %s report for %s as other, like trakt-web', (type, reason) => {
    expect(toReportTracking({ type, reason, result: { ok: true } }).reason).toBe('other');
  });

  it.each(['', 'nonsense', 'Spam'])('should send %j as other', (reason) => {
    expect(toReportTracking({ type: 'movie', reason, result: { ok: true } }).reason).toBe('other');
  });

  it.each([
    [{ ok: true }, 'sent'],
    [{ ok: true, status: 201 }, 'sent'],
    [{ ok: false, status: 409 }, 'already-reported'],
    [{ ok: false, status: 429 }, 'rate-limited'],
    [{ ok: false, status: 500 }, 'unknown'],
    [{ ok: false }, 'unknown'],
  ])('should give %j the %s outcome', (result, outcome) => {
    expect(toReportTracking({ type: 'list', reason: 'spam', result })).toEqual({
      type: 'list',
      reason: 'spam',
      outcome,
    });
  });
});
