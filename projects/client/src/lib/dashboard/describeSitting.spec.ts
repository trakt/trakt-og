import { describe, expect, it } from 'vitest';
import { describeSitting } from './describeSitting.ts';
import { groupSittings, type Sitting } from './groupSittings.ts';
import { socialFeedFixture } from './socialFeedFixture.ts';
import type { SocialActivity } from './socialActivitySchema.ts';
import type { SocialMedia } from './socialMediaSchema.ts';
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
      expect(mmf.tile.link?.text).toBe('Lanterns 1x06–1x08');
      expect(mmf.tile.still.href).toBe('/shows/lanterns/seasons/1/episodes/8');
      expect(mmf.tile.heart).toBe(10);
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
    it('should lead with the newest watch, even when a rating of another title is newer', () => {
      const damien = of('Damien');

      expect(texts(damien.head.links)).toEqual(['Lioness', 'Lanterns']);
      expect(damien.head.more).toBeNull();
      expect(damien.posters.titles.map(({ name }) => name)).toEqual(['Lioness', 'Lanterns']);
      expect(damien.tile).toEqual({
        link: { text: 'Lioness 3x02', href: '/shows/lioness/seasons/3/episodes/2' },
        still: { href: '/shows/lioness/seasons/3/episodes/2', path: expect.stringContaining('/167/187/fanarts/') },
        heart: null,
      });
      expect(damien.count).toBe('2 episodes');
      expect(damien.comments).toEqual([{ id: 12, review: false, on: 'Lioness 3x02' }]);
      expect(damien.sentence).toBe(
        'Damien watched 2 episodes across 2 shows, commented on Lioness 3x02 and rated Lanterns 8 out of 10.',
      );
    });

    it('should read the same whatever order the rows come in', () => {
      const [damien] = sittings.filter(({ member }) => member.name === 'Damien');
      if (!damien) throw new Error('no sitting');
      const shuffled = summary({ ...damien, items: damien.items.toReversed() });

      expect(shuffled.head).toEqual(of('Damien').head);
      expect(shuffled.tile).toEqual(of('Damien').tile);
      expect(shuffled.list).toEqual(of('Damien').list);
    });

    it('should count past two titles by their unit', () => {
      const kristin = of('Kristin');

      expect(texts(kristin.head.links)).toEqual(["That '70s Show", 'Home Improvement']);
      expect(kristin.head.more).toBe('+1 show');
      expect(kristin.count).toBe('3 episodes');
      expect(kristin.posters.titles).toHaveLength(3);
      expect(kristin.posters.more).toBe(0);
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

    it('should name every rating when more than one title was rated, never two bare hearts', () => {
      const [damien] = sittings.filter(({ member }) => member.name === 'Damien');
      const lioness = damien?.items.find(({ kind, title }) => kind === 'watch' && title.name === 'Lioness');
      const rating = damien?.items.find(({ kind }) => kind === 'rating');
      if (!damien || !lioness || !rating) throw new Error('no fixture rows');
      const both = summary({
        ...damien,
        items: [...damien.items, { ...rating, key: 'rating:900', title: lioness.title, label: lioness.label }],
      });

      expect(both.hearts).toEqual([]);
      expect(both.rated).toEqual([{ rating: 8, name: 'Lioness' }, { rating: 8, name: 'Lanterns' }]);
      expect(of('Damien').hearts).toEqual([]);
      expect(of('Damien').rated).toEqual([{ rating: 8, name: 'Lanterns' }]);
    });

    it('should show a title rated twice once, with its newest rating', () => {
      const mmf = sittings.find(({ member }) => member.name === 'MajorMercyFlush');
      const rating = mmf?.items.find(({ kind }) => kind === 'rating');
      if (!mmf || !rating) throw new Error('no fixture rows');
      const older = {
        ...rating,
        key: 'rating:901',
        rating: 6,
        at: new Date(Date.parse(rating.at) - 60_000).toISOString(),
      };
      const twice = summary({ ...mmf, items: [...mmf.items, older] });

      expect(twice.hearts).toEqual([10]);
      expect(twice.rated).toEqual([]);
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
    it('should say how long ago, and whether it was within the hour', () => {
      expect(of('Kristin')).toMatchObject({ ago: '24m', fresh: true, day: 'Today' });
      expect(of('MajorMercyFlush')).toMatchObject({ ago: '14h', fresh: false, day: 'Today' });
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

  describe("for Kristin's 33 episodes of 27 shows", () => {
    const day = of('Kristin', 1);

    it('should name two shows and count the rest as shows', () => {
      expect(texts(day.head.links)).toEqual(['Saved by the Bell', 'Raising Hope']);
      expect(day.head.more).toBe('+25 shows');
      expect(day.count).toBe('33 episodes · 27 shows');
      expect(day.span).toBe('8:20 AM – 11:17 PM');
      expect(day.sentence).toBe('Kristin watched 33 episodes across 27 shows.');
    });

    it('should show two posters and a box with the same count as the headline', () => {
      expect(day.posters.titles.map(({ name }) => name)).toEqual(['Saved by the Bell', 'Raising Hope']);
      expect(day.posters.titles.at(0)?.poster).toContain('/posters/');
      expect(day.posters.more).toBe(25);
    });

    it('should lead a tile with her newest episode', () => {
      expect(day.tile.link?.text).toBe('Saved by the Bell 1x06');
      expect(day.tile.still.href).toBe('/shows/saved-by-the-bell/seasons/1/episodes/6');
    });

    it('should list a line per show, newest first, then fold the rest behind a button', () => {
      const line = ({ name, codes }: { name: string; codes: string }) => `${name} ${codes}`;

      expect(day.list.lines.map(line)).toEqual([
        'Saved by the Bell 1x06',
        'Raising Hope 1x07',
        'The Addams Family 1x02',
        'Community 1x01',
        'Spin City 1x07',
        'The Drew Carey Show 3x23',
        'The Simpsons 2x03',
      ]);
      expect(day.list.rest).toHaveLength(20);
      expect(day.list.rest.map(line)).toContain('Roseanne 2x07, 1x10');
      expect(day.list.more).toBe('Show 20 more shows');
      expect(day.list.lines.at(0)?.time).toBe('11:17 PM');
    });
  });

  describe('for the count button', () => {
    const at = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();
    // The fixture rows with these ids, as one member's sitting a minute apart.
    const sittingOf = (rows: readonly SocialActivity[]) =>
      summary(
        groupSittings(toItems(rows.map((row, i) => ({
          ...row,
          user: { ...row.user, username: 'sample-rook', name: 'Rook', ids: { slug: 'sample-rook' } },
          activity_at: at(i + 1),
        })))).at(0),
      );
    const byId = (...ids: number[]) => ids.flatMap((id) => socialFeedFixture.rows(now).filter((row) => row.id === id));

    it('should have none for one watch, one watch with a rating or review, or a lone comment', () => {
      expect(of('Sefer', 1).count).toBeNull();
      expect(of('Sefer').count).toBeNull();
      expect(of('Technicolour').count).toBeNull();
      expect(of('Rook').count).toBeNull();
    });

    it('should count episodes, and name the shows only when they differ from the episodes', () => {
      expect(of('Justin').count).toBe('2 episodes');
      expect(texts(of('Justin').head.links)).toEqual(['PAW Patrol 7x01, 7x21']);
      expect(of('Damien').count).toBe('2 episodes');
      expect(of('Kristin', 1).count).toBe('33 episodes · 27 shows');
    });

    it('should count episodes and movies', () => {
      const mixed = sittingOf(byId(13, 0, 15));

      expect(mixed.count).toBe('2 episodes, 1 movie');
      expect(mixed.head.more).toBe('+1 show');
    });

    it('should fold three or more ratings into one button, and their hearts into its list', () => {
      const [template] = byId(14);
      if (!template) throw new Error('no fixture rating');
      const title = (trakt: number, name: string) => ({ ids: { trakt, slug: `title-${trakt}` }, title: name });
      const rate = (rating: number, media: SocialMedia): SocialActivity => ({
        id: rating,
        activity_at: '',
        user: template.user,
        action: 'rating',
        rating,
        ...media,
      });
      const ratings = sittingOf([
        rate(9, { type: 'show', show: title(1, 'Slow Horses') }),
        rate(8, { type: 'show', show: title(2, 'Severance') }),
        rate(10, { type: 'movie', movie: title(3, 'Dune: Part Two') }),
        rate(7, { type: 'show', show: title(4, 'The Bear') }),
      ]);

      expect(ratings.count).toBe('4 ratings');
      expect(ratings.hearts).toEqual([]);
      expect(texts(ratings.head.links)).toEqual(['Slow Horses', 'Severance']);
      expect(ratings.head.more).toBe('+2 more');
      expect(ratings.list.lines.map(({ rating }) => rating)).toEqual([9, 8, 10, 7]);
    });
  });

  it('should leave out the span of a sitting under two hours', () => {
    expect(of('Damien').span).toBeNull();
  });
});
