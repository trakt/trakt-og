import { describe, expect, it } from 'vitest';
import { followRequestsSchema } from './followRequestsSchema.ts';
import { toFollowRequest } from './toFollowRequest.ts';

describe('toFollowRequest', () => {
  it('should display a request in the viewer timezone with their date and time preferences', () => {
    const row = {
      id: 4,
      requested_at: '2026-09-30T00:15:00Z',
      user: { username: 'toby', name: 'Toby Gerlach', private: false, ids: { slug: 'toby-gerlach' } },
    };
    const datePreferences = { timeZone: 'America/Los_Angeles', order: 'dmy', hour24: true, weekStartDay: 1 } as const;
    expect(toFollowRequest(row, { datePreferences, now: new Date('2026-10-05T12:00:00Z') }))
      .toMatchObject({
        id: 4,
        slug: 'toby-gerlach',
        name: 'Toby Gerlach',
        requestedAt: '29 Sep 2026 17:15',
        requestedIso: '2026-09-30T00:15:00Z',
        requestedAgo: '5 days ago',
      });
  });

  it('should reject malformed proxied rows before their dates or profiles reach the page', () => {
    expect(followRequestsSchema.safeParse([{ id: 1, requested_at: 'not a date', user: {} }]).success).toBe(false);
    expect(followRequestsSchema.safeParse({ requests: [] }).success).toBe(false);
  });
});
