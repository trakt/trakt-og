import { describe, expect, it } from 'vitest';
import { socialFeedFixture } from './socialFeedFixture.ts';
import { socialWindows } from './socialWindows.ts';
import { toSocialBoard } from './toSocialBoard.ts';
import { toSocialItem } from './toSocialItem.ts';
import type { SocialCard, SocialView } from './toSocialBoard.ts';

/** The line under a poster as it reads: "Watched 1x03 at 9:48 AM". */
const text = ({ line }: SocialCard) => line.map((part) => part.text).join(' ');

const now = new Date('2026-09-30T12:00:30.500Z');
const datePreferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const windows = socialWindows('today', now, 'UTC');
const items = socialFeedFixture
  .rows(now)
  .filter(({ activity_at }) => Date.parse(activity_at) >= Date.parse(windows[0]?.start ?? ''))
  .map((row) => toSocialItem(row, datePreferences));
const board = (view: SocialView, live = socialFeedFixture.live(now).slice(0, 1)) =>
  toSocialBoard({ items, live, view, windows, now, datePreferences });
const card = (view: SocialView, key: string, live?: Parameters<typeof board>[1]) => {
  const found = board(view, live).cards.find((item) => item.key === key);
  if (!found) throw new Error(`no ${key} card`);
  return found;
};

describe('toSocialBoard', () => {
  describe('by title', () => {
    it("should give each member's latest title a turn before anyone's next, leaving out who's watching now", () => {
      expect(
        board('title')
          .cards.slice(0, 6)
          .map(({ key }) => key),
      ).toEqual([
        'title:show:that-70s-show',
        'title:show:persona-2025',
        'title:show:lanterns',
        'title:show:the-paper-2025',
        'title:show:paw-patrol',
        'title:show:home-improvement',
      ]);
    });

    it("should fold a member's titles past two into one card opening their history for the period", () => {
      const { cards, total } = board('title');
      const more = card('title', 'more:sample-kristin');

      expect(total).toBe(23);
      expect(cards).toHaveLength(9);
      expect(cards.filter(({ members }) => members[0]?.key === 'sample-kristin').map(({ key }) => key)).toEqual([
        'title:show:that-70s-show',
        'title:show:home-improvement',
        'more:sample-kristin',
      ]);
      expect(more).toMatchObject({ title: 'Kristin', folded: 15, members: [{ key: 'sample-kristin' }] });
      expect(text(more)).toBe('15 more titles');
      expect(more.href).toBe(
        '/users/sample-kristin/history?start_at=2026-09-29T12%3A00%3A00.000Z&end_at=2026-09-30T12%3A00%3A00.000Z',
      );
    });

    it('should show a third title rather than fold just one', () => {
      const three = new Set(['show:that-70s-show', 'show:home-improvement', 'show:lizzie-mcguire']);
      const fewer = items.filter(({ member, title }) => member.key !== 'sample-kristin' || three.has(title.key));
      const { cards } = toSocialBoard({ items: fewer, live: [], view: 'title', windows, now, datePreferences });

      expect(cards.map(({ key }) => key)).toContain('title:show:lizzie-mcguire');
      expect(cards.map(({ key }) => key)).not.toContain('more:sample-kristin');
    });

    it('should count what the people on a title did, latest first, without naming them', () => {
      const lanterns = card('title', 'title:show:lanterns');

      expect(text(lanterns)).toBe('2 watched, 3 rated');
      expect(lanterns.members.map(({ name }) => name)).toEqual(['Damien', 'MajorMercyFlush', 'Technicolour']);
      expect(lanterns.target).toMatchObject({ type: 'show', id: 157599 });
      expect(lanterns.href).toBe('/shows/lanterns');
    });

    it("should say what one member did: the episode and when, how many, a movie's day, or a rating", () => {
      expect(text(card('title', 'title:show:persona-2025'))).toBe('Watched 1x03 at 9:48 AM');
      expect(text(card('title', 'title:show:that-70s-show', []))).toBe('Watched 3x04 at 11:36 AM');
      expect(text(card('title', 'title:movie:weapons-2025'))).toBe('Watched yesterday');
      expect(text(card('title', 'title:show:paw-patrol'))).toBe('Watched 2 episodes yesterday');
    });

    it("should list each member's part for the card's details", () => {
      const details = card('title', 'title:show:lanterns').details ?? [];

      expect(details.map(({ member, watched, rating }) => [member.name, watched, rating])).toEqual([
        ['Damien', '1x08', 8],
        ['MajorMercyFlush', '3 episodes', 10],
        ['Technicolour', undefined, 8],
      ]);
    });

    it('should tag what stands out: one premiere or finale, a binge, a loved rating, then 3 or more watching', () => {
      expect(card('title', 'title:show:lanterns').tag).toEqual({ kind: 'binge', episodes: 3 });
      expect([
        card('title', 'title:show:the-paper-2025').tag,
        card('title', 'title:show:paw-patrol').tag,
        card('title', 'title:show:persona-2025').tag,
        card('time', 'time:watch:8').tag,
      ]).toEqual([
        { kind: 'episode', episode: { text: 'Series Premiere', kind: 'series-premiere' } },
        undefined,
        { kind: 'loved', rating: 9 },
        { kind: 'binge', episodes: 3 },
      ]);
    });
  });

  describe('by person', () => {
    it("should open each member's history for the period, latest first", () => {
      const [first, second] = board('person').cards;

      expect(first?.title).toBe('Kristin');
      expect(first && text(first)).toBe('17 titles');
      expect(first?.href).toBe(
        '/users/sample-kristin/history?start_at=2026-09-29T12%3A00%3A00.000Z&end_at=2026-09-30T12%3A00%3A00.000Z',
      );
      expect(second?.title).toBe('Sefer');
      expect(second && text(second)).toBe('2 titles');
      expect(second?.line.at(-1)).toMatchObject({ href: second?.href });
    });

    it("should list a person's titles, latest first, for their details", () => {
      const [first] = board('person').cards;

      expect(first?.member?.name).toBe('Kristin');
      expect(first?.details?.length).toBe(17);
      expect(first?.details?.[0]?.title).toMatchObject({ name: expect.any(String), href: expect.any(String) });
    });
  });

  describe('by time', () => {
    it("should list each row, with a member's back-to-back episodes of a show as one", () => {
      const binge = card('time', 'time:watch:8');
      expect(binge.href).toBe('/shows/lanterns');
      expect(text(binge)).toBe('3 episodes yesterday at 9:45 PM');
      expect(binge.line[0]).toMatchObject({
        href:
          '/users/sample-mmf/history?start_at=2026-09-29T12%3A00%3A00.000Z&end_at=2026-09-30T12%3A00%3A00.000Z' +
          '&show=157599',
      });
      expect(card('time', 'time:watch:10').number).toBe('1x08');
      expect(text(card('time', 'time:watch:10'))).toBe('Yesterday at 11:26 PM');
      expect(text(card('time', 'time:rating:9'))).toBe('Yesterday at 9:50 PM');
      expect(card('time', 'time:rating:9').rating).toEqual({ value: 10, href: '/users/sample-mmf/ratings' });
      expect(text(card('time', 'time:comment:12'))).toBe('Commented today at 12:10 AM');
      expect(card('time', 'time:comment:12').href).toBe('/comments/12');
    });

    it("should leave the member's name off, since the faces say it", () => {
      expect(card('time', 'time:watch:10')).not.toHaveProperty('who');
    });

    it("should leave out who's watching now, who has a card of their own", () => {
      expect(board('time').cards.at(0)).toMatchObject({ key: 'time:watch:17', number: '3x04' });
    });
  });

  it('should rank the members by everything they did, for the band', () => {
    const [top] = board('title').bars;

    expect(top?.name).toBe('Kristin');
    expect(top?.counts.map(({ value, noun }) => `${value} ${noun}`)).toEqual(['20 episodes']);
    expect(top?.avatar).toBeTruthy();
    expect(board('title', []).stats).toEqual({ activities: items.length, people: 6, titles: 23 });
    expect(board('title').stats.activities).toBe(items.length + 1);
  });
});
