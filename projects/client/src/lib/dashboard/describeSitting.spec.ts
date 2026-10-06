import { describe, expect, it } from 'vitest';
import { describeSitting } from './describeSitting.ts';
import { groupSittings, type Sitting } from './groupSittings.ts';
import { socialFeedFixture } from './socialFeedFixture.ts';
import type { SocialActivity } from './socialActivitySchema.ts';
import { toSocialItem } from './toSocialItem.ts';

const now = new Date('2026-10-05T16:30:00Z');
const datePreferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const toItems = (rows: readonly SocialActivity[]) => rows.map((row) => toSocialItem(row, datePreferences));
const sittings = groupSittings(toItems(socialFeedFixture.rows(now)));
const summary = (sitting: Sitting | undefined) => {
  if (!sitting) throw new Error('no sitting');
  return describeSitting({ sitting, now, datePreferences });
};
const of = (name: string, nth = 0) => summary(sittings.filter(({ member }) => member.name === name).at(nth));
const texts = (links: readonly { text: string }[]) => links.map(({ text }) => text);

// Rook's Lanterns episodes, newest first, watched a minute apart.
const lanterns = (episodes: readonly [number, number][]) => {
  const [template] = socialFeedFixture.rows(now).filter(({ id }) => id === 8);
  if (!template || template.type !== 'episode') throw new Error('no fixture watch');
  return groupSittings(toItems(episodes.map(([season, number], i) => ({
    ...template,
    id: 100 + i,
    activity_at: new Date(now.getTime() - (i + 1) * 60_000).toISOString(),
    episode: { ...template.episode, season, number },
  })))).at(0);
};

describe('describeSitting', () => {
  describe('for a binge of one show', () => {
    it('should lead with the show and its episodes, and count them in a chip', () => {
      const mmf = of('MajorMercyFlush');

      expect(texts(mmf.head.links)).toEqual(['Lanterns 1x06–1x08']);
      expect(mmf.count).toBe('3 episodes');
      expect(mmf.hearts).toEqual([10]);
    });

    it('should tell screen readers the whole sitting', () => {
      expect(of('MajorMercyFlush').sentence).toBe(
        'MajorMercyFlush binged Lanterns 1x06–1x08 and rated it 10 out of 10.',
      );
    });

    it('should join runs and leave gaps between them, counting a repeat once', () => {
      const rook = summary(lanterns([[2, 1], [1, 10], [1, 8], [1, 7], [1, 7], [1, 6]]));

      expect(texts(rook.head.links)).toEqual(['Lanterns 1x06–1x08, 1x10, 2x01']);
      expect(rook.count).toBe('6 episodes');
    });

    it('should say two episodes in a row as "and"', () => {
      expect(summary(lanterns([[1, 8], [1, 7]])).sentence).toBe('MajorMercyFlush watched Lanterns 1x07 and 1x08.');
    });
  });

  describe('for more than one title', () => {
    it('should show two titles in a row', () => {
      const damien = of('Damien');

      expect(texts(damien.head.links)).toEqual(['Lioness', 'Lanterns']);
      expect(damien.count).toBe('2 episodes');
      expect(damien.comments).toEqual([{ id: 12, review: false, on: 'Lioness 3x02' }]);
      expect(damien.sentence).toBe('Damien watched 2 episodes across 2 shows and commented on Lioness 3x02.');
    });

    it('should count past two titles', () => {
      const kristin = of('Kristin');

      expect(texts(kristin.head.links)).toEqual(["That '70s Show", 'Home Improvement']);
      expect(kristin.head.more).toBe(1);
    });

    it('should name a rating of a title they did not watch, and review the one they did', () => {
      const techni = of('Technicolour');

      expect(texts(techni.head.links)).toEqual(['The Paper 1x01']);
      expect(techni.hearts).toEqual([]);
      expect(techni.rated).toEqual([{ rating: 8, name: 'Lanterns' }]);
      expect(techni.comments).toEqual([{ id: 7, review: true, on: 'The Paper' }]);
      expect(techni.sentence).toBe(
        'Technicolour watched The Paper 1x01, reviewed it and rated Lanterns 1x08 8 out of 10.',
      );
    });
  });

  describe('for a check-in, a movie, and rows with no watch', () => {
    it('should say a check-in', () => {
      expect(of('Sefer').sentence).toBe('Sefer checked in to Persona 1x03 and rated it 9 out of 10.');
    });

    it('should write a movie by its title', () => {
      const movie = of('Sefer', 1);

      expect(texts(movie.head.links)).toEqual(['Weapons']);
      expect(movie.sentence).toBe('Sefer watched Weapons.');
    });

    it('should lead a comment-only sitting with what it was on', () => {
      const rook = of('Rook');

      expect(texts(rook.head.links)).toEqual(['Severance 2x10']);
      expect(rook.count).toBeNull();
      expect(rook.sentence).toBe('Rook commented on Severance 2x10.');
    });

    it("should keep a ratings-only sitting's hearts without repeating the titles", () => {
      const [rating] = socialFeedFixture.rows(now).filter(({ id }) => id === 14);
      if (!rating) throw new Error('no fixture rating');
      const ratingOnly = summary(groupSittings(toItems([rating])).at(0));

      expect(texts(ratingOnly.head.links)).toEqual(['Persona 1x03']);
      expect(ratingOnly.hearts).toEqual([9]);
      expect(ratingOnly.rated).toEqual([]);
      expect(ratingOnly.sentence).toBe('Sefer rated Persona 1x03 9 out of 10.');
    });
  });

  describe('for times', () => {
    it('should say how long ago', () => {
      expect(of('Kristin')).toMatchObject({ ago: '24m', day: 'Today' });
      expect(of('MajorMercyFlush')).toMatchObject({ ago: '14h', day: 'Today' });
    });

    it("should head older days by name in the viewer's zone", () => {
      expect(of('Kristin', 1).day).toBe('Yesterday');
      expect(of('Rook').day).toBe('Saturday');
      const [first] = sittings;
      if (!first) throw new Error('no sitting');
      const auckland = { ...datePreferences, timeZone: 'Pacific/Auckland' };

      expect(describeSitting({ sitting: first, now, datePreferences: auckland }).day).toBe('Today');
    });
  });

  it('should show up to three different stills', () => {
    expect(of('Kristin').thumbs.map(({ label }) => label)).toEqual([
      "That '70s Show 3x04",
      'Home Improvement 3x06',
      'Lizzie McGuire 1x24',
    ]);
    expect(of('Sefer').thumbs).toHaveLength(1);
  });
});
