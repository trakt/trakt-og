import { describe, expect, it } from 'vitest';
import type { CheckResult } from './CheckResult.ts';
import { formatReport } from './formatReport.ts';

const result = (overrides: Partial<CheckResult>): CheckResult => ({
  row: 'movie',
  group: 'title',
  label: 'title text',
  pass: true,
  ...overrides,
});

const agents = ['googlebot-phone', 'chrome'];

describe('formatReport', () => {
  it('should print one cell per row and group', () => {
    const report = formatReport({
      pages: [
        result({ agent: 'chrome' }),
        result({ group: 'og', label: 'og:title', pass: false, detail: 'found 0', agent: 'chrome' }),
        result({ row: 'person', group: 'og', label: 'og:title', pass: true, agent: 'chrome' }),
      ],
      site: [result({ row: 'robots.txt', group: 'robots.txt', label: 'answers 200', pass: false, detail: 'got 404' })],
      agents,
    });

    expect(report.split('\n').slice(0, 7)).toEqual([
      'page    title  og',
      'movie   ok     FAIL',
      'person  -      ok',
      '',
      'site        robots.txt',
      'robots.txt  FAIL',
      '',
    ]);
    expect(report).toMatch(/2 of 4 checks passed\.$/);
  });

  it('should list a failure once with every row that has it', () => {
    const failed = { group: 'og', label: 'og:title', pass: false, detail: 'found 0' };
    const report = formatReport({
      pages: ['movie', 'show'].flatMap((row) => agents.map((agent) => result({ ...failed, row, agent }))),
      site: [],
      agents,
    });

    expect(report).toContain('Failures (1):\n  og:title: found 0 (movie, show)');
  });

  it('should name the user-agents when only some of them see a failure', () => {
    const report = formatReport({
      pages: [
        result({ group: 'content', label: 'has <main>', pass: false, detail: 'splash only', agent: 'googlebot-phone' }),
        result({ group: 'content', label: 'has <main>', agent: 'chrome' }),
      ],
      site: [],
      agents,
    });

    expect(report).toContain('  has <main>: splash only [googlebot-phone] (movie)');
  });

  it('should report a known issue apart from failures, without counting it as one', () => {
    const report = formatReport({
      pages: [],
      site: [
        result({
          row: 'lists URLs',
          group: 'urls',
          label: '/lists/official/x indexable',
          pass: false,
          detail: 'got 404',
          known: '#240',
        }),
        result({ row: 'lists URLs', group: 'urls', label: '/lists/official/y indexable' }),
      ],
      agents,
    });

    expect(report).toContain('lists URLs  known');
    expect(report).not.toContain('Failures');
    expect(report).toContain('Known issues (1), not counted as failures:\n  /lists/official/x indexable (#240)');
    expect(report).toMatch(/1 of 2 checks passed, 1 known\.$/);
  });
});
