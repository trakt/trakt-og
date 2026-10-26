import { searchRowsSchema } from './searchRowsSchema.ts';
import { describe, expect, it } from 'vitest';
import { toSearchCard } from './toSearchCard.ts';
import { toSearchListRow } from './toSearchListRow.ts';

const all = { typeTag: true, now: new Date('2026-09-29T12:00:00Z'), order: 'mdy' } as const;
const oneType = { ...all, typeTag: false };

const poster = ['media.trakt.tv/images/shows/000/001/390/posters/medium/abc.jpg.webp'];
const art = (kind: string) => [`media.trakt.tv/images/shows/000/001/388/${kind}/medium/a.jpg.webp`];
const sized = (kind: string, size: string) =>
  `https://media.trakt.tv/images/shows/000/001/388/${kind}/${size}/a.jpg.webp`;

const hit = (fields: object) => searchRowsSchema.parse([fields]).at(0) ?? { type: 'show' };

const show = hit({
  type: 'show',
  show: {
    title: 'Breaking Bad',
    year: 2008,
    overview: 'A chemistry teacher turns to crime.',
    genres: ['drama', 'crime', 'thriller'],
    network: 'AMC',
    ids: { trakt: 1388, slug: 'breaking-bad' },
    images: { poster },
    rating: 8.9,
    aired_episodes: 62,
    first_aired: '2008-01-21T02:00:00.000Z',
    airs: { timezone: 'America/New_York' },
  },
});

describe('toSearchCard', () => {
  it('should tag a show with its type, network and episodes under two of its genres', () => {
    expect(toSearchCard(show, all)).toEqual({
      key: 'show-1388',
      type: 'show',
      id: 1388,
      href: '/shows/breaking-bad',
      title: 'Breaking Bad',
      year: 2008,
      overview: 'A chemistry teacher turns to crime.',
      certification: undefined,
      network: 'AMC',
      genres: ['Drama', 'Crime'],
      art: {
        poster: 'https://media.trakt.tv/images/shows/000/001/390/posters/thumb/abc.jpg.webp',
        fanart: undefined,
        logo: undefined,
      },
      tags: [{ text: 'Show' }, { text: 'AMC', kind: 'generic' }, { text: '62 episodes', kind: 'generic' }],
      released: true,
      rating: 8.9,
      airedEpisodes: 62,
      runtime: undefined,
    });
  });

  it('should tag a movie with its runtime and certification, and leave out what it lacks', () => {
    const movie = (fields: object) =>
      hit({ type: 'movie', movie: { title: 'Soon', year: 2027, ids: { trakt: 9, slug: 'soon' }, ...fields } });
    expect(toSearchCard(movie({ runtime: 176, certification: 'PG-13', released: '2027-01-01' }), all)).toMatchObject({
      tags: [{ text: 'Movie' }, { text: '2h 56m', kind: 'generic' }, { text: 'PG-13', kind: 'generic' }],
      released: false,
    });
    expect(toSearchCard(movie({}), all)?.tags).toEqual([{ text: 'Movie' }]);
  });

  it('should drop the type tag on single-type tabs', () => {
    expect(toSearchCard(show, oneType)?.tags.map(({ text }) => text)).toEqual(['AMC', '62 episodes']);
  });

  it('should carry every artwork, so the Display can switch without a reload', () => {
    const images = { poster: art('posters'), fanart: art('fanarts'), logo: art('logos') };
    expect(toSearchCard(hit({ type: 'show', show: { ...show.show, images } }), all)?.art).toEqual({
      poster: sized('posters', 'thumb'),
      fanart: sized('fanarts', 'thumb'),
      logo: sized('logos', 'medium'),
    });
  });

  describe('for episodes', () => {
    const screenshot = ['media.trakt.tv/images/episodes/000/000/001/screenshots/medium/s.jpg.webp'];
    const still = 'https://media.trakt.tv/images/episodes/000/000/001/screenshots/thumb/s.jpg.webp';
    const images = { poster: art('posters'), fanart: art('fanarts'), logo: art('logos') };
    const episode = (fields: object = {}) =>
      hit({
        type: 'episode',
        show: { ...show.show, images },
        episode: {
          title: 'Pilot',
          season: 1,
          number: 1,
          ids: { trakt: 62085 },
          first_aired: '2008-01-21T02:00:00.000Z',
          rating: 8.2,
          ...fields,
        },
      });

    it('should number an episode under its show and date it in the show zone', () => {
      expect(toSearchCard(episode(), all)).toMatchObject({
        key: 'episode-62085',
        season: { show: 1388, number: 1, episode: 1 },
        href: '/shows/breaking-bad/seasons/1/episodes/1',
        number: '1x01',
        title: 'Pilot',
        smallTitle: { text: 'Breaking Bad', href: '/shows/breaking-bad' },
        tags: [{ text: 'Episode' }, { text: 'Jan 20, 2008', kind: 'generic' }],
      });
    });

    it("should draw its screenshot as the fanart, with the show's fanart for spoilers", () => {
      expect(toSearchCard(episode({ images: { screenshot } }), all)?.art).toEqual({
        poster: sized('posters', 'thumb'),
        fanart: still,
        logo: sized('logos', 'medium'),
        spoilerFanart: sized('fanarts', 'thumb'),
      });
      expect(toSearchCard(episode(), all)?.art).toMatchObject({
        fanart: sized('fanarts', 'thumb'),
        spoilerFanart: undefined,
      });
    });

    it('should mark a premiere in ID mode only', () => {
      expect(toSearchCard(episode(), { ...all, premiereTag: true })?.episodeBadge).toEqual({
        label: 'Series Premiere',
        kind: 'series-premiere',
      });
      expect(toSearchCard(episode(), all)?.episodeBadge).toBeUndefined();
    });
  });

  describe('for people', () => {
    const person = (fields: object) =>
      hit({ type: 'person', person: { name: 'Aaron Paul', ids: { trakt: 2, slug: 'aaron-paul' }, ...fields } });

    it('should draw the headshot whatever the artwork', () => {
      const headshot = ['media.trakt.tv/images/people/000/000/002/headshots/medium/h.jpg.webp'];
      const image = 'https://media.trakt.tv/images/people/000/000/002/headshots/thumb/h.jpg.webp';
      expect(toSearchCard(person({ images: { headshot } }), all)).toMatchObject({
        href: '/people/aaron-paul',
        title: 'Aaron Paul',
        art: { poster: image, fanart: image },
        tags: [{ text: 'Person' }],
      });
    });

    it('should tag a person with their age or when they died, and what they are known for', () => {
      const known = (birthday: string, death: string | null) =>
        person({ birthday, death, known_for_department: 'acting' });
      expect(toSearchCard(known('1979-08-27', null), all)?.tags).toEqual([
        { text: 'Person' },
        { text: 'Age 47', kind: 'generic' },
        { text: 'Acting', kind: 'generic' },
      ]);
      expect(toSearchCard(known('1884-08-10', '1952-03-12'), oneType)?.tags).toEqual([
        { text: 'Died Mar 12, 1952', kind: 'generic' },
        { text: 'Acting', kind: 'generic' },
      ]);
    });
  });

  it('should skip a list and a hit missing its object', () => {
    expect(toSearchCard(hit({ type: 'list' }), all)).toBeNull();
    expect(toSearchCard(hit({ type: 'movie' }), all)).toBeNull();
  });
});

describe('toSearchListRow', () => {
  const list = (type: 'personal' | 'official', allowComments: boolean) =>
    hit({
      type: 'list',
      list: {
        name: 'Based on a Book',
        type,
        allow_comments: allowComments,
        item_count: 610,
        comment_count: 4,
        likes: 311,
        description: 'Adaptations.',
        ids: { trakt: 3930949, slug: 'based-on-a-book' },
        user: { username: 'preethi', name: '', ids: { slug: 'preethi', trakt: 1 } },
        images: { posters: poster },
      },
    });

  it('should link a personal list under its owner and hide comments when they are off', () => {
    expect(toSearchListRow(list('personal', false))).toEqual({
      key: 'list-3930949',
      id: 3930949,
      kind: 'personal',
      href: '/users/preethi/lists/based-on-a-book',
      name: 'Based on a Book',
      owner: { slug: 'preethi', name: 'preethi', href: '/users/preethi', avatar: undefined, vip: null },
      posters: [
        {
          title: 'Based on a Book',
          image: 'https://media.trakt.tv/images/shows/000/001/390/posters/thumb/abc.jpg.webp',
        },
      ],
      itemCount: 610,
      likeCount: 311,
      commentCount: undefined,
      pills: [],
      description: 'Adaptations.',
    });
  });

  it('should link an official list to its page, so its comments count reaches the comments page', () => {
    expect(toSearchListRow(list('official', true))).toMatchObject({
      href: '/lists/official/based-on-a-book',
      commentCount: 4,
      pills: ['Official List'],
    });
  });

  it('should skip anything but a list', () => {
    expect(toSearchListRow(show)).toBeNull();
  });
});
