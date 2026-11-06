/** One essential list: the list it opens, its art, its two-part title and an optional green label. */
export type FeaturedList = {
  readonly id: number;
  readonly title: readonly [string, string];
  readonly background: string;
  readonly logo: string;
  readonly label?: string;
  /** A square logo, which stays upright on its closed slice instead of turning on its side. */
  readonly upright?: boolean;
};

// The art OG kept in app/assets/images/lists/<site>/, copied as files.
const art: Record<string, string> = import.meta.glob('../assets/lists/*/*.{jpg,png}', {
  eager: true,
  import: 'default',
});

const tile = (
  id: number,
  site: string,
  title: [string, string],
  { label, upright }: { label?: string; upright?: boolean } = {},
): FeaturedList => ({
  id,
  title,
  background: art[`../assets/lists/${site}/bg.jpg`] ?? '',
  logo: art[`../assets/lists/${site}/logo.png`] ?? '',
  ...(label && { label }),
  ...(upright && { upright }),
});

/**
 * The essential lists, OG's Featured Lists: IMDB's top 250s, the MCU and Star Wars, then the Best Picture winners,
 * Star Trek, DC and The X-Files. The art was hardcoded in OG, and so were the ids, except the MCU and DC, which now
 * point at lists that are kept up to date.
 */
export const featuredLists: readonly FeaturedList[] = [
  tile(2_142_753, 'imdb', ['IMDB', 'Top 250 Movies'], { label: 'Updated Daily' }),
  tile(2_143_363, 'imdb-tv', ['IMDB', 'Top 250 TV Shows'], { label: 'Updated Daily' }),
  tile(26_086_884, 'marvel', ['MARVEL', 'Cinematic Universe']),
  tile(2_233_867, 'star-wars', ['Star Wars', 'Timeline']),
  tile(832_943, 'academy-awards', ['Academy Awards', 'Best Picture Winners'], { upright: true }),
  tile(5_790_552, 'star-trek', ['Star Trek', 'Timeline']),
  tile(37_521_451, 'dc', ['DC', 'Universe'], { upright: true }),
  tile(1_402_475, 'x-files', ['The Essential', 'X-Files']),
];
