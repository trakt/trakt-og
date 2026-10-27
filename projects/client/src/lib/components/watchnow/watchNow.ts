import type { CountryOffers, Offer, WatchNowOffers, WatchNowSources } from './watchNowSchema.ts';
import { uniqueBy } from '../../utils/uniqueBy.ts';

/** One country's offers from `/watchnow/:country`. */
export type Offers = CountryOffers;

/** OG's section order in the modal (`Streamable#all_streaming_links`), each titled by its key. */
export const OFFER_TYPES = ['free', 'subscription', 'cable', 'purchase', 'cinema'] as const;
type OfferType = (typeof OFFER_TYPES)[number];

/** A service as `/watchnow/sources/:country` describes it. */
export type Source = {
  name: string;
  /** A white logo on a transparent 2:1 canvas, drawn over `color`. Missing for some, which show `name` instead. */
  logo?: string;
  color: string;
  /** The store badge for a channel sold through another service ("on Apple TV"). */
  channel?: string;
};

/** A service tile: the sidebar's two, and every link in the modal. */
export type ServiceLink = Source & { slug: string; href: string };

export type WatchNowButton = {
  /** The API path the modal loads from: the item's, or S1E1's for a show with no sources of its own. */
  path: string;
  tiles: ServiceLink[];
  /** Services in the viewer's country, OG's `streaming_source_count`. */
  count: number;
  /** How many of them the viewer marked as favorites. */
  favorites: number;
  /** Only cinemas sell it: "Buy Tickets" and "N cinemas". */
  cinemaOnly: boolean;
  /** The viewer only wants their favorites, and none of them has it. */
  hidden: boolean;
  /** The viewer's watch-now country, where the modal opens. */
  country: string;
  /** Their favorite services as API stores them (`us-netflix`), for the modal's "Your Favorites". */
  favoriteKeys: readonly string[];
  /** The client ID may not call watch-now routes: the block says so in place of the button. */
  unavailable?: boolean;
};

/** What an offer costs under its tile: Rent and Buy amounts, or a short note ("Included", "with subscription"). */
export type OfferTerms =
  | { kind: 'prices'; prices: readonly { label: 'Rent' | 'Buy'; amount: string; lowest: boolean }[] }
  | { kind: 'note'; title: string; detail?: string };

export type WatchNowSection = {
  title: string;
  favorites: boolean;
  links: (ServiceLink & { uhd: boolean; terms: OfferTerms })[];
};

export const https = (path: string) => `https://${path.replace(/^https?:\/\//, '')}`;

export function toSourceMap(response: WatchNowSources | null, country: string) {
  const rows = response?.flatMap((byCountry) => byCountry[country] ?? []) ?? [];
  return new Map<string, Source>(
    rows.map(({ source, name, color, images }) => [
      source,
      {
        name,
        color: color ?? '#000',
        ...(images?.logo && { logo: https(images.logo) }),
        ...(images?.channel && { channel: https(images.channel) }),
      },
    ]),
  );
}

/** Every offer in one list, in section order. */
const allOffers = (offers: Offers | null | undefined) => OFFER_TYPES.flatMap((type) => offers?.[type] ?? []);

/** The services that carry it, each once, in section order. */
export const offerSlugs = (offers: Offers | null | undefined) => [
  ...new Set(allOffers(offers).map(({ source }) => source)),
];

/** "Services" per country for the modal's country picker: "United States (6)". */
export const countryCounts = (all: WatchNowOffers | null) =>
  Object.fromEntries(Object.entries(all ?? {}).map(([country, offers]) => [country, offerSlugs(offers).length]));

/** The viewer's favorites for this country, as bare slugs. API stores `us-netflix`, or a bare slug for their own. */
export const favoriteSlugs = (favorites: readonly string[], country: string, home: string) =>
  favorites.flatMap((key) => {
    const [prefix, slug] = key.includes('-') ? key.split('-', 2) : [home, key];
    return prefix === country && slug ? [slug] : [];
  });

type WatchNowButtonParams = {
  path: string;
  offers: Offers | null;
  /** Ranked `us-apple_tv` keys from `/watchnow/favorites/:country`. OG's `prioritize_sources`. */
  order: readonly string[] | null;
  sources: Map<string, Source>;
  country: string;
  /** The viewer's `browsing.watchnow` settings, if signed in. */
  favorites: readonly string[];
  onlyFavorites: boolean;
};

/** The sidebar block: two tiles, favorites first, and the count under the button. */
export function toWatchNowButton(params: WatchNowButtonParams): WatchNowButton {
  const { path, offers, order, sources, country, favorites, onlyFavorites } = params;
  const slugs = offerSlugs(offers);
  const liked = favoriteSlugs(favorites, country, country).filter((slug) => slugs.includes(slug));
  const ranked =
    order?.flatMap((key) => (key.startsWith(`${country}-`) ? [key.slice(country.length + 1)] : [])) ?? slugs;
  const cinemaOnly =
    (offers?.cinema.length ?? 0) > 0 && slugs.every((slug) => offers?.cinema.some((offer) => offer.source === slug));

  return {
    path,
    // OG took four and its CSS hid the third and fourth.
    tiles: [...new Set([...liked, ...ranked])]
      .slice(0, 4)
      .flatMap((slug) => toLink(slug, allOffers(offers), sources))
      .slice(0, 2),
    count: slugs.length,
    favorites: liked.length,
    cinemaOnly,
    hidden: onlyFavorites && liked.length === 0,
    country,
    favoriteKeys: favorites,
  };
}

function toLink(slug: string, offers: readonly Offer[], sources: Map<string, Source>) {
  const source = sources.get(slug);
  const offer = offers.find((row) => row.source === slug);
  return source && offer ? [{ ...source, slug, href: https(offer.link) }] : [];
}

const money = (amount: string, currency: string | null | undefined) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: (currency || 'usd').toUpperCase() }).format(
    Number(amount),
  );

/** An Amazon, Roku or Apple TV channel says which one: "with Starz subscription". */
const CHANNEL = /_amazon_prime|_ama?zon_channels?|_roku_premium_channel/;

type Lowest = { rent: number | null; purchase: number | null };

/** The cheapest rent and buy among the stores, or null where every store charges the same (nothing to point out). */
function lowestPrices(offers: readonly Offer[]): Lowest {
  const cheapest = (key: 'rent' | 'purchase') => {
    const amounts = offers.flatMap(({ prices }) => (prices[key] ? [Number(prices[key])] : []));
    const min = Math.min(...amounts);
    return amounts.some((amount) => amount !== min) ? min : null;
  };
  return { rent: cheapest('rent'), purchase: cheapest('purchase') };
}

function offerTerms(type: OfferType, offer: Offer, name: string, lowest: Lowest): OfferTerms {
  switch (type) {
    case 'subscription':
      return {
        kind: 'note',
        title: 'Included',
        detail: CHANNEL.test(offer.source)
          ? `with ${name.replace(/ \(on (Amazon|Roku|Apple TV)\)/, '')} subscription`
          : 'with subscription',
      };
    case 'cable':
      return { kind: 'note', title: 'Free', detail: 'with cable login' };
    case 'free':
      return { kind: 'note', title: 'Free' };
    case 'cinema':
      return { kind: 'note', title: 'In cinemas', detail: 'Buy tickets' };
    case 'purchase': {
      const row = (label: 'Rent' | 'Buy', key: 'rent' | 'purchase') => {
        const amount = offer.prices[key];
        return amount ? [{ label, amount: money(amount, offer.currency), lowest: Number(amount) === lowest[key] }] : [];
      };
      const prices = [...row('Rent', 'rent'), ...row('Buy', 'purchase')];
      return prices.length > 0 ? { kind: 'prices', prices } : { kind: 'note', title: 'Rent or buy' };
    }
  }
}

type WatchNowSectionsParams = {
  offers: Offers | null | undefined;
  sources: Map<string, Source>;
  /** Bare slugs of the viewer's favorites in this country. */
  favorites: readonly string[];
};

/**
 * The modal's sections: "Your Favorites", then one per offer type. A favorite
 * isn't repeated below, empty sections drop out, and a service the sources list doesn't know is skipped.
 */
export function toWatchNowSections({ offers, sources, favorites }: WatchNowSectionsParams): WatchNowSection[] {
  const byType = OFFER_TYPES.map((type) => ({
    type,
    offers: uniqueBy(offers?.[type] ?? [], ({ source }) => source),
  }));
  const lowest = lowestPrices(byType.find(({ type }) => type === 'purchase')?.offers ?? []);
  const link = (type: OfferType, offer: Offer) => {
    const source = sources.get(offer.source);
    if (!source) return [];
    const terms = offerTerms(type, offer, source.name, lowest);
    return [{ ...source, slug: offer.source, href: https(offer.link), uhd: offer.uhd, terms }];
  };

  const liked = favorites.flatMap((slug) => {
    const found = byType.find(({ offers }) => offers.some((offer) => offer.source === slug));
    const offer = found?.offers.find((row) => row.source === slug);
    return found && offer ? link(found.type, offer) : [];
  });
  const used = new Set(liked.map(({ slug }) => slug));

  return [
    { title: 'Your Favorites', favorites: true, links: liked },
    ...byType.map(({ type, offers }) => ({
      title: type,
      favorites: false,
      links: offers.filter(({ source }) => !used.has(source)).flatMap((offer) => link(type, offer)),
    })),
  ].filter(({ links }) => links.length > 0);
}
