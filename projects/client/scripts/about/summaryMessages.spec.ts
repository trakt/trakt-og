import { describe, expect, it } from 'vitest';
import { aboutSections } from '../../src/lib/about/aboutSections.ts';
import { summaryMessages } from './summaryMessages.ts';

describe('util: summaryMessages', () => {
  const [system, user] = summaryMessages({
    subjects: ['feat(users): show the ratings box', 'fix(lists): keep the sort'],
    pullTitles: ['feat(users): ratings box'],
  });

  it('should set the rules in the system message', () => {
    expect(system?.role).toBe('system');
    expect(system?.content).toContain("Don't name any people.");
    expect(system?.content).toContain('60 characters or fewer');
    expect(aboutSections.every((section) => system?.content.includes(section))).toBe(true);
  });

  it('should pass only the commit subjects and pull request titles', () => {
    expect(user).toEqual({
      role: 'user',
      content: 'Commits:\n- feat(users): show the ratings box\n- fix(lists): keep the sort\n\n' +
        'Merged pull requests:\n- feat(users): ratings box',
    });
  });

  it('should say when no pull request was merged', () => {
    expect(summaryMessages({ subjects: ['fix: a'], pullTitles: [] }).at(1)?.content).toContain(
      'Merged pull requests:\n- none',
    );
  });
});
