import { DISCOVER_THEMES } from '../discover/discoverThemes.ts';
import { seasonRibbon } from '../discover/seasonRibbon.ts';
import { traktUrls } from '../traktUrls.ts';
import { readableStat } from '../utils/readableStat.ts';
import type { RecapMonth, RecapRibbon } from './RecapRibbon.ts';

type ToRecapRibbonParams = {
  /** `YYYY-MM-DD` in the viewer's zone. */
  today: string;
  /** Plays per month from January, through this month; in January, all twelve of last year's. */
  plays: readonly number[];
  slug: string;
};

const exact = (n: number) => n.toLocaleString('en-US');
const playCount = (n: number, format: (n: number) => string) => `${format(n)} ${n === 1 ? 'play' : 'plays'}`;
const monthName = (year: number, month: number) =>
  new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });

/**
 * The dashboard's recap strip: this year's months in Discover's month colors, each with its plays and a bar against the
 * busiest month. Months gone by open their Month in Review, the latest one is tagged as the Month in Review, and this
 * month counts down its days. In January it's last year, every month gone by and December the latest review, under
 * last year's Year in Review, as OG's dashboard opened it in January.
 */
export function toRecapRibbon({ today, plays, slug }: ToRecapRibbonParams): RecapRibbon {
  const [thisYear = 0, month = 1, day = 1] = today.split('-').map(Number);
  const reviewing = month === 1;
  const year = reviewing ? thisYear - 1 : thisYear;
  // Past every month while reviewing last year, so all twelve read as gone by.
  const current = reviewing ? 13 : month;
  const busiest = Math.max(0, ...plays);

  const months = seasonRibbon(DISCOVER_THEMES, today).map((season, index): RecapMonth => {
    const number = index + 1;
    const count = plays.at(index) ?? null;
    const name = `${monthName(year, number)} ${year}`;
    const base = {
      number,
      month: season.month,
      theme: season.id,
      progress: number < current ? 1 : season.progress,
      plays: count,
      share: count && busiest ? count / busiest : 0,
    };

    if (number > current || count === null) {
      return { ...base, state: 'future', caption: '', tag: null, label: name, href: null };
    }
    if (number === current) {
      const days = season.daysLeft ?? 0;
      return {
        ...base,
        state: 'current',
        caption: playCount(count, readableStat),
        tag: { kind: 'left', days },
        label: `${name} so far: ${playCount(count, exact)}, ${days} ${days === 1 ? 'day' : 'days'} left`,
        href: `/users/${encodeURIComponent(slug)}/history`,
      };
    }
    const latest = number === current - 1;
    return {
      ...base,
      state: 'past',
      caption: playCount(count, readableStat),
      tag: latest ? { kind: 'review' } : null,
      label: `${name}: ${playCount(count, exact)}${latest ? ', Month in Review' : ''}`,
      href: traktUrls.monthInReview(slug, year, number),
    };
  });

  return {
    year,
    title: reviewing || (month === 12 && day >= 18) ? 'Year in Review' : 'Year to Date',
    plays: plays.reduce((sum, n) => sum + n, 0),
    href: traktUrls.yearInReview(slug, year),
    months,
  };
}
