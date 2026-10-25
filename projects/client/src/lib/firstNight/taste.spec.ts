import { describe, expect, it, vi } from 'vitest';
import { fetchTasteCountries, fetchTasteServices, toTasteCountries, toTasteServices } from './taste.ts';

const respond = (body: unknown) => vi.fn<typeof globalThis.fetch>(() => Promise.resolve(Response.json(body)));

describe('toTasteServices', () => {
  it('should rank popular services first, then others by links, then channels, then stores, without cinemas', () => {
    const services = toTasteServices(
      [
        {
          us: [
            { source: 'apple_tv', name: 'Apple TV Store', link_count: 900 },
            { source: 'amc_theatres', name: 'AMC', cinema: true },
            {
              source: 'acorn_tv_channel',
              name: 'Acorn TV',
              link_count: 500,
              images: { channel: 'media.trakt.tv/c.webp' },
            },
            { source: 'kanopy', name: 'Kanopy ', link_count: 10 },
            { source: 'mubi', name: 'MUBI', link_count: 5 },
            {
              source: 'tubi',
              name: 'Tubi',
              link_count: 50,
              color: '#fa382f',
              images: { logo: 'media.trakt.tv/t.webp' },
            },
            { source: 'netflix', name: 'Netflix', link_count: 1 },
          ],
        },
      ],
      'us',
    );

    expect(services.map(({ slug }) => slug)).toEqual([
      'netflix',
      'mubi',
      'tubi',
      'kanopy',
      'acorn_tv_channel',
      'apple_tv',
    ]);
    expect(services.find(({ slug }) => slug === 'tubi')).toEqual({
      slug: 'tubi',
      name: 'Tubi',
      color: '#fa382f',
      logo: 'https://media.trakt.tv/t.webp',
    });
    expect(services.find(({ slug }) => slug === 'kanopy')).toMatchObject({ name: 'Kanopy', color: '#000' });
  });

  it('should leave out other countries', () => {
    expect(toTasteServices([{ gb: [{ source: 'itvx', name: 'ITVX' }] }], 'us')).toEqual([]);
  });
});

describe('toTasteCountries', () => {
  it('should sort countries by name with lowercase codes and https flags', () => {
    expect(
      toTasteCountries([
        { code: 'US', name: 'United States', images: { flag: 'media.trakt.tv/us.svg' } },
        { code: 'AL', name: 'Albania' },
      ]),
    ).toEqual([
      { code: 'al', name: 'Albania' },
      { code: 'us', name: 'United States', flag: 'https://media.trakt.tv/us.svg' },
    ]);
  });
});

describe('fetchTasteServices', () => {
  it('should map a valid body', async () => {
    const services = await fetchTasteServices(respond([{ us: [{ source: 'netflix', name: 'Netflix' }] }]), 'us');
    expect(services.map(({ slug }) => slug)).toEqual(['netflix']);
  });

  it('should show no services for a malformed body', async () => {
    expect(await fetchTasteServices(respond({ us: 'netflix' }), 'us')).toEqual([]);
  });
});

describe('fetchTasteCountries', () => {
  it('should show no countries for a malformed body', async () => {
    expect(await fetchTasteCountries(respond({ countries: [] }))).toEqual([]);
  });
});
