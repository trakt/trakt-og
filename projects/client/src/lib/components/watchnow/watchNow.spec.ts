import { describe, expect, it } from 'vitest';
import {
  countryCounts,
  type Favorite,
  favoriteSlugs,
  type Offers,
  parseFavorites,
  type Source,
  toSourceMap,
  toWatchNowButton,
  toWatchNowSections,
} from './watchNow.ts';
import type { Offer } from './watchNowSchema.ts';

const offer = (source: string, extra: Partial<Offer> = {}): Offer => ({
  source,
  link: `watchnow.trakt.tv/watchnow/${source}`,
  uhd: false,
  currency: 'usd',
  prices: { rent: null, purchase: null },
  ...extra,
});

const offers = (
  rows: Partial<Record<'free' | 'subscription' | 'cable' | 'purchase' | 'cinema', string[]>>,
): Offers => ({
  free: (rows.free ?? []).map((slug) => offer(slug)),
  subscription: (rows.subscription ?? []).map((slug) => offer(slug)),
  cable: (rows.cable ?? []).map((slug) => offer(slug)),
  purchase: (rows.purchase ?? []).map((slug) => offer(slug, { prices: { rent: '3.99', purchase: '19.99' } })),
  cinema: (rows.cinema ?? []).map((slug) => offer(slug)),
});

const prices = (...rows: ['Rent' | 'Buy', string, boolean][]) => ({
  kind: 'prices',
  prices: rows.map(([label, amount, lowest]) => ({ label, amount, lowest })),
});

const sources = new Map<string, Source>(
  ['netflix', 'apple_tv', 'amazon_video', 'youtube', 'starz_amazon_channel', 'amc_theatres'].map((slug) => [
    slug,
    slug === 'starz_amazon_channel'
      ? {
          name: 'Starz (on Amazon)',
          color: '#000',
          channel: 'https://media.trakt.tv/watchnow/badges/amazon-channel.webp',
        }
      : { name: slug.toUpperCase(), color: '#000' },
  ]),
);

const button = (overrides: Partial<Parameters<typeof toWatchNowButton>[0]> = {}) =>
  toWatchNowButton({
    path: '/movies/fight-club-1999',
    offers: offers({ subscription: ['netflix'], purchase: ['amazon_video', 'apple_tv', 'youtube'] }),
    order: ['us-apple_tv', 'us-amazon_video', 'us-youtube', 'us-netflix'],
    sources,
    country: 'us',
    favorites: [],
    onlyFavorites: false,
    ...overrides,
  });

describe('toWatchNowButton', () => {
  it('shows the first two ranked services and counts each service once', () => {
    const result = button();
    expect(result.tiles.map(({ slug }) => slug)).toEqual(['apple_tv', 'amazon_video']);
    expect(result.tiles[0]?.href).toBe('https://watchnow.trakt.tv/watchnow/apple_tv');
    expect(result).toMatchObject({ count: 4, favorites: 0, cinemaOnly: false, hidden: false });
  });

  it('puts the viewer’s favorites first, bare slugs meaning their own country', () => {
    const result = button({ favorites: ['us-youtube', 'netflix', 'gb-apple_tv', 'us-hulu'] });
    expect(result.tiles.map(({ slug }) => slug)).toEqual(['youtube', 'netflix']);
    expect(result.favorites).toBe(2);
  });

  it('skips a service the sources list doesn’t name, among the first four', () => {
    const result = button({ order: ['us-unknown', 'us-youtube', 'us-apple_tv'] });
    expect(result.tiles.map(({ slug }) => slug)).toEqual(['youtube', 'apple_tv']);
  });

  it('falls back to section order without a ranking', () => {
    expect(button({ order: null }).tiles.map(({ slug }) => slug)).toEqual(['netflix', 'amazon_video']);
  });

  it('is cinema-only when every service sells tickets', () => {
    expect(button({ offers: offers({ cinema: ['amc_theatres'] }) }).cinemaOnly).toBe(true);
    expect(button({ offers: offers({ cinema: ['amc_theatres'], free: ['youtube'] }) }).cinemaOnly).toBe(false);
  });

  it('hides for a viewer who only wants favorites when none has it', () => {
    expect(button({ onlyFavorites: true }).hidden).toBe(true);
    expect(button({ onlyFavorites: true, favorites: ['us-netflix'] }).hidden).toBe(false);
    expect(button({ favorites: [] }).hidden).toBe(false);
  });

  it('has nothing to show with no offers', () => {
    expect(button({ offers: null, order: null })).toMatchObject({ tiles: [], count: 0 });
  });
});

describe('toWatchNowSections', () => {
  it('lists favorites first, then each non-empty offer type without repeating them', () => {
    const sections = toWatchNowSections({
      offers: {
        us: offers({
          subscription: ['netflix', 'starz_amazon_channel'],
          purchase: ['apple_tv', 'apple_tv', 'youtube'],
        }),
      },
      country: 'us',
      sources: { us: sources },
      favorites: [{ country: 'us', slug: 'youtube' }],
    });
    expect(sections.map(({ title, links }) => [title, links.map(({ slug }) => slug)])).toEqual([
      ['Your Favorites', ['youtube']],
      ['subscription', ['netflix', 'starz_amazon_channel']],
      ['purchase', ['apple_tv']],
    ]);
    expect(sections.map(({ favorites }) => favorites)).toEqual([true, false, false]);
    expect(sections[1]?.links.map(({ terms }) => terms)).toEqual([
      { kind: 'note', title: 'Included', detail: 'with subscription' },
      { kind: 'note', title: 'Included', detail: 'with Starz subscription' },
    ]);
    expect(sections[2]?.links[0]?.terms).toEqual(prices(['Rent', '$3.99', false], ['Buy', '$19.99', false]));
  });

  it('names the subscription a channel needs from its store badge, whatever its slug', () => {
    const badge = (name: string) => `https://media.trakt.tv/watchnow/badges/${name}.webp`;
    const channels = new Map<string, Source>([
      ['amazonhbomax', { name: 'HBO Max (on Amazon)', color: '#000', channel: badge('amazon-channel') }],
      ['amazon_mgm_plus', { name: 'MGM+ (on Amazon)', color: '#000', channel: badge('amazon-channel') }],
      ['arthaus_plus_apple_tv_channel', { name: 'Arthaus+ (on Apple TV)', color: '#000', channel: badge('apple-tv') }],
      ['netflix_standard_with_ads', { name: 'Netflix Standard with Ads', color: '#000', channel: badge('ads') }],
    ]);
    const [section] = toWatchNowSections({
      offers: { de: offers({ subscription: [...channels.keys()] }) },
      country: 'de',
      sources: { de: channels },
      favorites: [],
    });
    expect(section?.links.map(({ terms }) => terms.kind === 'note' && terms.detail)).toEqual([
      'with HBO Max subscription',
      'with MGM+ subscription',
      'with Arthaus+ subscription',
      'with subscription',
    ]);
  });

  describe('for stores', () => {
    const priced = (rows: [string, string | null, string | null][]): Offers => ({
      ...offers({}),
      purchase: rows.map(([slug, rent, purchase]) => offer(slug, { prices: { rent, purchase } })),
    });
    const terms = (rows: [string, string | null, string | null][]) =>
      toWatchNowSections({
        offers: { us: priced(rows) },
        country: 'us',
        sources: { us: sources },
        favorites: [{ country: 'us', slug: 'youtube' }],
      }).flatMap(({ links }) => links.map(({ slug, terms }) => [slug, terms]));

    it('should mark the cheapest rent and buy, favorites included', () => {
      expect(
        terms([
          ['apple_tv', '4.99', '17.99'],
          ['amazon_video', '4.99', '9.99'],
          ['youtube', '3.99', '19.99'],
        ]),
      ).toEqual([
        ['youtube', prices(['Rent', '$3.99', true], ['Buy', '$19.99', false])],
        ['apple_tv', prices(['Rent', '$4.99', false], ['Buy', '$17.99', false])],
        ['amazon_video', prices(['Rent', '$4.99', false], ['Buy', '$9.99', true])],
      ]);
    });

    it('should mark nothing when every store charges the same', () => {
      const same = prices(['Rent', '$3.49', false], ['Buy', '$7.99', false]);
      expect(
        terms([
          ['apple_tv', '3.49', '7.99'],
          ['amazon_video', '3.49', '7.99'],
        ]),
      ).toEqual([
        ['apple_tv', same],
        ['amazon_video', same],
      ]);
    });

    it('should show only the prices a store has, or a note with none', () => {
      expect(
        terms([
          ['apple_tv', null, '9.99'],
          ['amazon_video', null, null],
        ]),
      ).toEqual([
        ['apple_tv', prices(['Buy', '$9.99', false])],
        ['amazon_video', { kind: 'note', title: 'Rent or buy' }],
      ]);
    });
  });

  describe('with favorites from other countries', () => {
    const all = {
      us: offers({ subscription: ['netflix'], purchase: ['apple_tv', 'youtube'] }),
      gb: offers({ subscription: ['netflix'], purchase: ['apple_tv', 'amazon_video'] }),
      ca: offers({ free: ['youtube'] }),
    };
    const sections = (favorites: Favorite[], known = { us: sources, gb: sources }) =>
      toWatchNowSections({ offers: all, country: 'us', sources: known, favorites }).map(({ title, links }) => [
        title,
        links.map(({ slug, country }) => (country ? `${country}-${slug}` : slug)),
      ]);

    it('should list them after the picked country’s, keeping the local service below', () => {
      expect(
        sections([
          { country: 'gb', slug: 'netflix' },
          { country: 'us', slug: 'youtube' },
          { country: 'gb', slug: 'amazon_video' },
        ]),
      ).toEqual([
        ['Your Favorites', ['youtube', 'gb-netflix', 'gb-amazon_video']],
        ['subscription', ['netflix']],
        ['purchase', ['apple_tv']],
      ]);
    });

    it('should skip one that country doesn’t have, or whose services haven’t loaded', () => {
      expect(
        sections([
          { country: 'gb', slug: 'youtube' },
          { country: 'ca', slug: 'youtube' },
          { country: 'fr', slug: 'netflix' },
        ])[0],
      ).toEqual(['subscription', ['netflix']]);
    });

    it('should mark only the picked country’s cheapest prices', () => {
      const terms = toWatchNowSections({
        offers: {
          us: { ...offers({}), purchase: [offer('apple_tv', { prices: { rent: '3.99', purchase: '9.99' } })] },
          gb: {
            ...offers({}),
            purchase: [offer('apple_tv', { currency: 'gbp', prices: { rent: '1', purchase: '2' } })],
          },
        },
        country: 'us',
        sources: { us: sources, gb: sources },
        favorites: [{ country: 'gb', slug: 'apple_tv' }],
      })[0]?.links[0];
      expect(terms).toMatchObject({ country: 'gb', terms: prices(['Rent', '£1.00', false], ['Buy', '£2.00', false]) });
    });
  });

  it('is empty when nothing is available', () => {
    expect(toWatchNowSections({ offers: undefined, country: 'us', sources: { us: sources }, favorites: [] })).toEqual(
      [],
    );
  });
});

describe('helpers', () => {
  it('counts distinct services per country', () => {
    expect(
      countryCounts({ us: offers({ free: ['youtube'], purchase: ['youtube', 'apple_tv'] }), gb: offers({}) }),
    ).toEqual({ us: 2, gb: 0 });
  });

  it('reads favorites in every country, bare slugs meaning home', () => {
    expect(parseFavorites(['us-netflix', 'hulu', 'gb-now_tv'], 'us')).toEqual([
      { country: 'us', slug: 'netflix' },
      { country: 'us', slug: 'hulu' },
      { country: 'gb', slug: 'now_tv' },
    ]);
  });

  it('keeps favorites for the picked country', () => {
    expect(favoriteSlugs(['us-netflix', 'hulu', 'gb-now_tv'], 'us', 'us')).toEqual(['netflix', 'hulu']);
    expect(favoriteSlugs(['us-netflix', 'hulu', 'gb-now_tv'], 'gb', 'us')).toEqual(['now_tv']);
  });

  it('maps a country’s sources with https images', () => {
    const map = toSourceMap(
      [
        {
          us: [
            {
              source: 'netflix',
              name: 'Netflix',
              free: false,
              cinema: false,
              color: '#e50914',
              images: { logo: 'media.trakt.tv/watchnow/sources/netflix.webp', channel: null },
            },
          ],
        },
      ],
      'us',
    );
    expect(map.get('netflix')).toEqual({
      name: 'Netflix',
      color: '#e50914',
      logo: 'https://media.trakt.tv/watchnow/sources/netflix.webp',
    });
  });
});
