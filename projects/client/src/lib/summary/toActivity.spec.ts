import type { ProfileResponse } from '@trakt/api';
import { describe, expect, it } from 'vitest';
import type { SocialRow } from './SocialRow.ts';
import { type ActivityTab, toActivity } from './toActivity.ts';

const profile = (slug: string, extra: Partial<ProfileResponse> = {}): ProfileResponse => ({
  username: slug,
  private: false,
  deleted: false,
  ids: { slug, trakt: 1 },
  images: { avatar: { full: `https://media.trakt.tv/${slug}.jpg` } },
  ...extra,
});

const social = (slug: string, plays: number | null, rating?: number): SocialRow => ({
  user: { username: slug, ids: { slug } },
  watched: plays === null ? null : { plays, rating: rating === undefined ? null : { rating } },
});

const sectionsOf = (tab: ActivityTab | undefined) => (tab && tab.id !== 'watching' ? tab.sections : []);
const keysOn = (tab: ActivityTab | undefined, label: string) =>
  sectionsOf(tab).find((section) => section.label === label)?.users.map(({ key }) => key);

describe('toActivity', () => {
  it('should leave out every tab when nobody watches and nobody is followed', () => {
    expect(toActivity({ watching: [], social: null, following: null })).toEqual([]);
  });

  describe('for watching now', () => {
    it('should count everyone and show private members with the placeholder and no link', () => {
      const [tab] = toActivity({
        watching: [profile('sean'), profile('hidden', { private: true, images: null })],
        social: null,
        following: null,
      });
      expect(tab).toMatchObject({ id: 'watching', number: '2', text: ['Watching', 'Now'], followed: [] });
      expect(tab?.id === 'watching' && tab.others).toEqual([
        { key: 'sean', name: 'sean', href: '/users/sean', avatar: 'https://media.trakt.tv/sean.jpg' },
        {
          key: 'private-1',
          name: 'hidden',
          avatar: 'https://media.trakt.tv/hotlink-ok/placeholders/medium/zoidberg.png',
        },
      ]);
    });

    it('should put the followed members first and name how many in the tab', () => {
      const [tab] = toActivity({
        watching: [profile('a'), profile('b'), profile('c', { private: true })],
        social: null,
        following: new Set(['b', 'c']),
      });
      expect(tab).toMatchObject({ number: '3', text: ['Watching Now', '1 You Follow'] });
      expect(tab?.id === 'watching' && tab.followed.map(({ key }) => key)).toEqual(['b']);
      expect(tab?.id === 'watching' && tab.others.map(({ key }) => key)).toEqual(['a', 'private-2']);
    });
  });

  describe('for people watched', () => {
    it("should place a movie's followed members by plays and skip the ones who only watchlisted", () => {
      const tabs = toActivity({
        watching: [],
        social: [social('a', 1), social('b', 4, 8), social('c', null), social('d', 1)],
        following: null,
      });
      expect(tabs.map(({ id }) => id)).toEqual(['watched', 'rated']);

      const [watched] = tabs;
      expect(watched).toMatchObject({ number: '3', text: ['People', 'Watched'] });
      expect(sectionsOf(watched).map(({ label, name }) => `${label} ${name}`)).toEqual([
        '1 One and done',
        '2 Round two',
        '3 Hat trick',
        "4–5 Can't stop",
        '6–9 Comfort watch',
        '10+ Knows every line',
      ]);
      expect(keysOn(watched, '1')).toEqual(['a', 'd']);
      expect(keysOn(watched, '4–5')).toEqual(['b']);
      expect(sectionsOf(watched).map(({ share }) => share)).toEqual([67, 0, 0, 33, 0, 0]);
      expect(sectionsOf(watched).at(0)?.title).toBe('1 play · One and done');
    });

    it("should place a show's followed members by how much of it they've seen", () => {
      const row = (slug: string, plays: number, minutes?: number): SocialRow => ({
        user: { username: slug, ids: { slug } },
        watched: { plays, minutes_watched: minutes },
      });
      const [watched] = toActivity({
        watching: [],
        // 100 episodes, 3,000 minutes in all.
        social: [row('sampler', 3, 90), row('fan', 60, 1500), row('rewatcher', 210, 6600), row('no-minutes', 95)],
        following: null,
        show: { airedEpisodes: 100, totalRuntime: 3000 },
      });
      expect(sectionsOf(watched).map(({ label }) => label)).toEqual([
        '<10%',
        '10–49%',
        '50–89%',
        '90–149%',
        '150–299%',
        '300%+',
      ]);
      expect(keysOn(watched, '<10%')).toEqual(['sampler']);
      expect(keysOn(watched, '50–89%')).toEqual(['fan']);
      expect(keysOn(watched, '90–149%')).toEqual(['no-minutes']);
      expect(keysOn(watched, '150–299%')).toEqual(['rewatcher']);
      expect(sectionsOf(watched).find(({ label }) => label === '50–89%')).toMatchObject({
        title: '50–89% watched · Deep in it',
      });
      expect(sectionsOf(watched).flatMap(({ users }) => users).find(({ key }) => key === 'rewatcher')?.progress)
        .toBe(220);
    });
  });

  describe('for rated by', () => {
    it("should average the followers' ratings like API and place them on every rating", () => {
      const rated = toActivity({
        watching: [],
        social: [social('a', 1, 7), social('b', 1, 10), social('c', 1, 9)],
        following: null,
      }).find(({ id }) => id === 'rated');
      expect(rated).toMatchObject({ number: '86', heart: 8, text: ['Rated by', '3 People'] });
      expect(sectionsOf(rated).map(({ label }) => label)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
      expect(sectionsOf(rated).find(({ label }) => label === '10')).toMatchObject({
        name: 'Totally Ninja!',
        level: 10,
        share: 33,
      });
      expect(keysOn(rated, '7')).toEqual(['a']);
    });
  });

  it('should say Person for one', () => {
    const tabs = toActivity({ watching: [], social: [social('a', 2, 6)], following: null });
    expect(tabs.map(({ text }) => text)).toEqual([['Person', 'Watched'], ['Rated by', '1 Person']]);
  });
});
