import { countryName, titleize } from '../components/summary/names.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { formatDate } from '../utils/formatDate.ts';
import { toReleaseAxis } from './toReleaseAxis.ts';

interface Release {
  readonly country: string;
  readonly certification?: string | null;
  readonly release_date: string;
  readonly release_type?: string;
  readonly note?: string | null;
}

/** One release, with its certification only when it differs from the country's. */
export interface ReleaseDate {
  readonly date: string;
  readonly dateText: string;
  readonly type: string;
  readonly limited: boolean;
  readonly certification: string;
  /** A physical release's disc formats that have a library logo ("4K Ultra HD" is `bluray_ultrahd`). */
  readonly formats: readonly { readonly logo: string; readonly label: string }[];
  /** The rest of the API's note, each part a tag. */
  readonly notes: readonly string[];
}

export interface ReleaseStop extends ReleaseDate {
  readonly released: boolean;
  /** Days until the next release, null on the others. */
  readonly countdown: number | null;
  /** Today falls between this stop and the next. */
  readonly today: boolean;
}

/** Limited releases share Theatrical, and a type the API adds later lands in Unknown. */
const COLUMNS = [
  { id: 'premiere', label: 'Premiere' },
  { id: 'theatrical', label: 'Theatrical' },
  { id: 'digital', label: 'Digital' },
  { id: 'physical', label: 'Physical' },
  { id: 'tv', label: 'TV' },
  { id: 'unknown', label: 'Unknown' },
] as const;

const DAY = 86_400_000;

/** Disc names in physical notes ("4K Ultra HD / Blu-ray / DVD") and their library logos. */
const FORMAT_LOGOS: Readonly<Record<string, string>> = {
  '4k': 'bluray_ultrahd',
  '4k ultra hd': 'bluray_ultrahd',
  '4k uhd': 'bluray_ultrahd',
  'ultra hd blu-ray': 'bluray_ultrahd',
  'blu-ray': 'bluray',
  bluray: 'bluray',
  dvd: 'dvd',
  'hd dvd': 'hddvd',
  vhs: 'vhs',
  laserdisc: 'laserdisc',
  betamax: 'betamax',
  vcd: 'vcd',
};

function toNotes(note: string | null | undefined, type: string | undefined) {
  if (!note) return { formats: [], notes: [] };
  if (type !== 'physical') return { formats: [], notes: [note] };
  const parts = note
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);
  const logoOf = (part: string) => FORMAT_LOGOS[part.toLowerCase()];
  return {
    formats: parts.flatMap((label) => {
      const logo = logoOf(label);
      return logo ? [{ logo, label }] : [];
    }),
    notes: parts.filter((part) => !logoOf(part)),
  };
}

const columnOf = (type = 'unknown') =>
  type === 'limited' ? 'theatrical' : (COLUMNS.find(({ id }) => id === type)?.id ?? 'unknown');

const typeLabel = (type = 'unknown') => (type === 'limited' ? 'Theatrical' : type === 'tv' ? 'TV' : titleize(type));

function toStops(dates: readonly ReleaseDate[], today: string): readonly ReleaseStop[] {
  const next = dates.findIndex(({ date }) => date > today);
  return dates.map((release, i) => ({
    ...release,
    released: release.date <= today,
    countdown: i === next ? Math.round((Date.parse(release.date) - Date.parse(today)) / DAY) : null,
    today: next > 0 && i === next - 1,
  }));
}

/**
 * Release dates as one row per country in name order, each release a mark on one shared date axis and in a column per
 * release type the movie has (for the type filter), plus the viewer's country (else the original country) as a dated
 * track. `today` is `YYYY-MM-DD` in the viewer's zone.
 */
export function toMovieReleases({
  releases,
  originalCountry,
  viewerCountry,
  today,
  datePreferences,
}: {
  releases: readonly Release[];
  originalCountry?: string | null;
  viewerCountry?: string | null;
  today: string;
  datePreferences: DatePreferences;
}) {
  const sorted = releases
    .map((release) => ({ ...release, date: release.release_date.slice(0, 10), code: release.country.toLowerCase() }))
    .toSorted((a, b) => a.date.localeCompare(b.date));
  const axis = toReleaseAxis({ dates: sorted.map(({ date }) => date), today });
  const columns = COLUMNS.filter(({ id }) => sorted.some(({ release_type }) => columnOf(release_type) === id));
  const countries = [...new Set(sorted.map(({ code }) => code))]
    .map((code) => {
      const own = sorted.flatMap((release, i) =>
        release.code === code ? [{ ...release, at: axis.positions.at(i) ?? 0 }] : [],
      );
      const certification =
        (
          own.find(({ release_type, certification }) => columnOf(release_type) === 'theatrical' && certification) ??
          own.find(({ certification }) => certification)
        )?.certification ?? '';
      const dates = own.map((release) => ({
        column: columnOf(release.release_type),
        at: release.at,
        release: {
          date: release.date,
          // These are calendar dates, not local instants: never shift the day with the viewer's time zone.
          dateText: formatDate(release.date, { ...datePreferences, timeZone: 'UTC', format: 'll' }),
          type: typeLabel(release.release_type),
          limited: release.release_type === 'limited',
          certification: release.certification && release.certification !== certification ? release.certification : '',
          ...toNotes(release.note, release.release_type),
        },
      }));
      return {
        code,
        name: countryName(code),
        original: code === originalCountry?.toLowerCase(),
        certification,
        dates: dates.map(({ release }) => release),
        cells: columns.map(({ id }) => dates.filter(({ column }) => column === id).map(({ release }) => release)),
        marks: dates.map(({ column, at, release }) => ({ column, at, release })),
      };
    })
    .toSorted((a, b) => a.name.localeCompare(b.name, 'en'));
  const viewer = viewerCountry?.toLowerCase();
  const featured = countries.find(({ code }) => code === viewer) ?? countries.find(({ original }) => original);
  return {
    columns: columns.map(({ id, label }, i) => ({
      id,
      label,
      count: countries.filter(({ cells }) => (cells.at(i)?.length ?? 0) > 0).length,
    })),
    countries,
    ticks: axis.ticks,
    today: axis.today,
    featured: featured && {
      ...featured,
      tag: featured.code === viewer ? 'Your Country' : 'Original Country',
      stops: toStops(featured.dates, today),
    },
  };
}
