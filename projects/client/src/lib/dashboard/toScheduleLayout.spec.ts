import { describe, expect, it } from 'vitest';
import type { ScheduleDay } from './ScheduleDay.ts';
import type { ScheduleItem } from './ScheduleItem.ts';
import { toScheduleLayout } from './toScheduleLayout.ts';

const episode = (show: string, code: string, time: string, label?: ScheduleItem['label']): ScheduleItem => ({
  key: `${show}-${code}`,
  group: `show-${show}`,
  title: show,
  href: `/shows/${show}`,
  episode: { number: code, title: `Episode ${code}`, href: `/shows/${show}/${code}` },
  time,
  label,
});
const movie = (title: string): ScheduleItem => ({
  key: title,
  group: `movie-${title}`,
  title,
  href: `/movies/${title}`,
});
const shows = (count: number, time = '9:00 pm') =>
  Array.from({ length: count }, (_, i) => episode(`show${i}`, '1x01', time));

const RELATIVE = ['Today', 'Tomorrow', 'Wednesday', 'Thursday', 'Friday'];
const day = (offset: number, items: readonly ScheduleItem[]): ScheduleDay => ({
  date: `2026-10-0${5 + offset}`,
  offset,
  relative: offset < 0 ? 'Yesterday' : RELATIVE.at(offset) ?? '',
  short: `Oct ${5 + offset}`,
  items,
});

describe('toScheduleLayout', () => {
  it('should be null when nothing is on', () => {
    expect(toScheduleLayout([])).toBeNull();
  });

  describe('the spotlight', () => {
    it('should be tonight when today has something on', () => {
      const layout = toScheduleLayout([day(0, shows(1)), day(1, shows(1))]);

      expect(layout?.spotlight).toMatchObject({ heading: 'Tonight', short: 'Oct 5' });
      expect(layout?.spotlight.nothing).toBeUndefined();
      expect(layout?.week.map(({ relative }) => relative)).toEqual(['Tomorrow']);
    });

    it('should say which days before it have nothing on', () => {
      const next = (offset: number) => toScheduleLayout([day(offset, shows(1))])?.spotlight;

      expect(next(1)).toMatchObject({ heading: 'Next up · Tomorrow', nothing: 'Nothing on today.' });
      expect(next(2)?.nothing).toBe('Nothing on today or tomorrow.');
      expect(next(3)?.nothing).toBe('Nothing on for the next 3 days.');
    });

    it('should name a day before today without "Next up"', () => {
      expect(toScheduleLayout([day(-1, shows(1))])?.spotlight).toMatchObject({ heading: 'Yesterday' });
    });

    it('should show three cards and the rest of the day as rows', () => {
      const spotlight = toScheduleLayout([day(1, shows(9))])?.spotlight;

      expect(spotlight?.cards.map(({ title }) => title)).toEqual(['show0', 'show1', 'show2']);
      expect(spotlight?.also).toMatchObject({ heading: 'Also Tomorrow', count: 6 });
      expect(spotlight?.also?.shown).toHaveLength(5);
      expect(spotlight?.also?.more.map(({ title }) => title)).toEqual(['show8']);
    });

    it('should leave out the rows when three cards cover the day', () => {
      expect(toScheduleLayout([day(0, shows(3))])?.spotlight.also).toBeUndefined();
    });
  });

  describe('the week', () => {
    it('should show five rows a day, then the rest behind more', () => {
      const [wednesday] = toScheduleLayout([day(0, shows(1)), day(2, shows(7))])?.week ?? [];

      expect(wednesday?.shown).toHaveLength(5);
      expect(wednesday?.more).toHaveLength(2);
    });

    it('should keep the air order', () => {
      const items = [episode('a', '1x01', '8:00 pm'), movie('dune'), episode('b', '1x01', '9:00 pm')];
      const [tomorrow] = toScheduleLayout([day(0, shows(1)), day(1, items)])?.week ?? [];

      expect(tomorrow?.shown.map(({ title }) => title)).toEqual(['a', 'dune', 'b']);
    });
  });

  describe('a show with more than one episode a day', () => {
    const premiere = { label: 'Season Premiere', kind: 'season-premiere' } as const;
    const layout = toScheduleLayout([day(0, [
      episode('carrie', '1x01', '3:00 am', premiere),
      episode('cia', '2x01', '4:00 am'),
      episode('carrie', '1x02', '5:00 am'),
      episode('carrie', '1x03', '6:00 am'),
    ])]);
    const [carrie, cia] = layout?.spotlight.cards ?? [];

    it('should merge them into one row at the first time, with its tag', () => {
      expect(layout?.spotlight.cards).toHaveLength(2);
      expect(carrie).toMatchObject({ title: 'carrie', time: '3:00 am', label: premiere });
      expect(carrie?.episodes.map(({ number }) => number)).toEqual(['1x01', '1x02', '1x03']);
    });

    it('should keep a single episode as one', () => {
      expect(cia?.episodes.map(({ number }) => number)).toEqual(['2x01']);
    });

    it('should take Watch Now from any episode that has it', () => {
      const watchNow = { title: 'b' } as NonNullable<ScheduleItem['watchNow']>;
      const pair = [episode('b', '1x01', '9:00 pm'), { ...episode('b', '1x02', '9:30 pm'), watchNow }];

      expect(toScheduleLayout([day(0, pair)])?.spotlight.cards.at(0)?.watchNow).toBe(watchNow);
    });
  });

  it('should give a movie no episodes', () => {
    expect(toScheduleLayout([day(0, [movie('dune')])])?.spotlight.cards.at(0)?.episodes).toEqual([]);
  });
});
