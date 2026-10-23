import { describe, expect, it } from 'vitest';
import type { AboutWeek } from './AboutWeek.ts';
import { summaryPlan } from './summaryPlan.ts';

const now = new Date('2026-10-22T12:00:00Z');

const stored = (overrides: Partial<AboutWeek> = {}): AboutWeek => ({
  week: '2026-10-19',
  from: '2026-10-19',
  to: '2026-10-25',
  counts: { new: 1, fixed: 0, faster: 0 },
  sections: [],
  authors: [],
  commits: [],
  summary: {
    title: 'A week',
    themes: [{ section: 'Profiles', text: 'Profiles show more.' }],
    through: 'aaaaaaa',
    at: '2026-10-22T07:00:00Z',
  },
  lastCommit: 'aaaaaaa',
  updatedAt: '2026-10-22T07:00:00Z',
  final: false,
  ...overrides,
});

const plan = (overrides: Partial<Parameters<typeof summaryPlan>[0]>) =>
  summaryPlan({ current: true, stored: stored(), lastCommit: 'bbbbbbb', now, canSummarize: true, ...overrides });

describe('util: summaryPlan', () => {
  describe('for the current week', () => {
    it('should summarize new commits once the last summary is 4 hours old', () => {
      expect(plan({})).toEqual({ summarize: true, final: false });
    });

    it('should wait while the last summary is under 4 hours old', () => {
      expect(plan({ now: new Date('2026-10-22T10:59:00Z') })).toEqual({ summarize: false, final: false });
    });

    it('should not summarize again when no commit is new', () => {
      expect(plan({ lastCommit: 'aaaaaaa' })).toEqual({ summarize: false, final: false });
    });

    it('should write the first summary right away', () => {
      expect(plan({ stored: stored({ summary: null }) })).toEqual({ summarize: true, final: false });
      expect(plan({ stored: null })).toEqual({ summarize: true, final: false });
    });

    it('should never mark it final', () => {
      expect(plan({ stored: stored({ final: true }) })?.final).toBe(false);
    });
  });

  describe('for a past week', () => {
    it('should summarize it once more with all its commits and mark it final', () => {
      expect(plan({ current: false, now: new Date('2026-10-22T08:00:00Z') })).toEqual({ summarize: true, final: true });
    });

    it('should backfill a week that was never written', () => {
      expect(plan({ current: false, stored: null })).toEqual({ summarize: true, final: true });
    });

    it('should never touch a final week again', () => {
      expect(plan({ current: false, stored: stored({ final: true }) })).toBeNull();
    });
  });

  describe('without a model', () => {
    it('should keep past weeks open so a later model can summarize them', () => {
      expect(plan({ current: false, canSummarize: false })).toEqual({ summarize: false, final: false });
    });

    it('should not summarize the current week', () => {
      expect(plan({ stored: null, canSummarize: false })).toEqual({ summarize: false, final: false });
    });
  });
});
