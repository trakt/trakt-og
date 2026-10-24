import { describe, expect, it } from 'vitest';
import { socialFeedFixture } from './socialFeedFixture.ts';
import { socialWindows } from './socialWindows.ts';
import { toSocialBoard } from './toSocialBoard.ts';
import { toSocialItem } from './toSocialItem.ts';
import type { SocialCard, SocialView } from './toSocialBoard.ts';

/** The line under a poster as it reads: "Watched 1x03 · 9:48 AM". */
const text = ({ line }: SocialCard) => line.map((part) => part.text).join(' · ');

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
    it("should list each title by who's touched it last, leaving out who's watching now", () => {
      expect(
        board('title')
          .cards.slice(0, 3)
          .map(({ key }) => key),
      ).toEqual(['title:show:that-70s-show', 'title:show:home-improvement', 'title:show:lizzie-mcguire']);
    });

    it('should count the friends on a title, latest first', () => {
      const lanterns = card('title', 'title:show:lanterns');

      expect(text(lanterns)).toBe('3 friends');
      expect(lanterns.members.map(({ name }) => name)).toEqual(['Damien', 'MajorMercyFlush', 'Technicolour']);
      expect(lanterns.target).toMatchObject({ type: 'show', id: 157599 });
      expect(lanterns.href).toBe('/shows/lanterns');
    });

    it("should say what one member did: the episode and when, how many, a movie's day, or a rating", () => {
      expect(text(card('title', 'title:show:persona-2025'))).toBe('Watched 1x03 · 9:48 AM');
      expect(text(card('title', 'title:show:that-70s-show', []))).toBe('Watched 3x04 · 11:36 AM');
      expect(text(card('title', 'title:movie:weapons-2025'))).toBe('Watched · Yesterday');
      expect(text(card('title', 'title:show:paw-patrol'))).toBe('Watched 2 episodes');
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
  });

  describe('by time', () => {
    it("should list each row, with a member's back-to-back episodes of a show as one", () => {
      const binge = card('time', 'time:watch:8');
      expect(binge.href).toBe('/shows/lanterns');
      expect(text(binge)).toBe('3 episodes · Yesterday, 9:45 PM');
      expect(binge.line[0]).toMatchObject({
        href:
          '/users/sample-mmf/history?start_at=2026-09-29T12%3A00%3A00.000Z&end_at=2026-09-30T12%3A00%3A00.000Z' +
          '&show=157599',
      });
      expect(card('time', 'time:watch:10').number).toBe('1x08');
      expect(text(card('time', 'time:watch:10'))).toBe('Yesterday, 11:26 PM');
      expect(text(card('time', 'time:rating:9'))).toBe('Yesterday, 9:50 PM');
      expect(card('time', 'time:rating:9').rating).toEqual({ value: 10, href: '/users/sample-mmf/ratings' });
      expect(text(card('time', 'time:comment:12'))).toBe('Commented · Today, 12:10 AM');
      expect(card('time', 'time:comment:12').href).toBe('/comments/12');
    });

    it("should leave out who's watching now, who has a card of their own", () => {
      expect(board('time').cards.at(0)).toMatchObject({ key: 'time:watch:17', number: '3x04' });
    });
  });

  it('should rank the members by everything they did, for the band', () => {
    const [top] = board('title').bars;

    expect(top?.name).toBe('Kristin');
    expect(top?.counts.map(({ text }) => text)).toEqual(['20 episodes']);
    expect(top?.avatar).toBeTruthy();
    expect(board('title', []).stats).toEqual({ activities: items.length, people: 6, titles: 23 });
    expect(board('title').stats.activities).toBe(items.length + 1);
  });
});
