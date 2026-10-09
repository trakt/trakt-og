import { describe, expect, it } from 'vitest';
import { groupSittings, type Sitting } from './groupSittings.ts';
import { socialFeedFixture } from './socialFeedFixture.ts';
import { splitSitting } from './splitSitting.ts';
import { toSocialItem } from './toSocialItem.ts';

const now = new Date('2026-10-05T16:30:00Z');
const datePreferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const sittings = groupSittings(socialFeedFixture.rows(now).map((row) => toSocialItem(row, datePreferences)));
const of = (name: string) => {
  const sitting = sittings.find(({ member }) => member.name === name);
  if (!sitting) throw new Error('no sitting');
  return sitting;
};
const titles = (sitting: Sitting | null) => sitting?.items.map(({ kind, title }) => `${kind}:${title.name}`);

describe('splitSitting', () => {
  it('should lead with the title watched last, even when a rating of another title is newer', () => {
    const { lead, rest } = splitSitting(of('Damien'));

    expect(titles(lead)).toEqual(['comment:Lioness', 'watch:Lioness']);
    expect(titles(rest)).toEqual(['rating:Lanterns', 'watch:Lanterns']);
  });

  it('should key and date each part by its own rows', () => {
    const { lead, rest } = splitSitting(of('Damien'));

    expect(lead.key).toBe(`sample-damien:${lead.items.at(0)?.key}`);
    expect(lead.newest).toBe(lead.items.at(0)?.at);
    expect(lead.oldest).toBe(lead.items.at(-1)?.at);
    expect(rest?.key).toBe(`sample-damien:${rest?.items.at(0)?.key}`);
    expect(rest?.key).not.toBe(lead.key);
  });

  it('should leave no rest when the sitting is one title', () => {
    const { lead, rest } = splitSitting(of('MajorMercyFlush'));

    expect(lead).toEqual(of('MajorMercyFlush'));
    expect(rest).toBeNull();
  });

  it('should split the same whatever order the rows come in', () => {
    const damien = of('Damien');

    expect(splitSitting({ ...damien, items: damien.items.toReversed() })).toEqual(splitSitting(damien));
  });
});
