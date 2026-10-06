import { traktUrls } from '../../../../traktUrls.ts';
import type { BoxInput } from '../BoxInput.ts';
import { defineProfileBox } from '../defineProfileBox.ts';
import AboutMeBox from './AboutMeBox.svelte';
import type { AboutMeView } from './AboutMeView.ts';

type Fact = Extract<AboutMeView, { kind: 'other' }>['facts'][number];

const monthYear = (at: string) =>
  new Date(at).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

function vipLabel({ vip }: BoxInput['profile']) {
  if (vip?.kind !== 'vip') return null;
  return vip.years ? `VIP · ${vip.years} yrs` : 'VIP';
}

function watchedFact({ episodes, movies }: BoxInput['stats']): Fact | null {
  const total = episodes.watched + movies.watched;
  if (total === 0) return null;
  const what = episodes.watched === 0 ? 'movies' : movies.watched === 0 ? 'episodes' : 'episodes and movies';
  return { text: 'Watched', bold: `${total.toLocaleString('en-US')} ${what}` };
}

function facts({ profile, stats, genres }: BoxInput): readonly Fact[] {
  const genre = genres.at(0)?.genre.name;
  return [
    genre ? { text: 'Mostly watches', bold: genre } : null,
    watchedFact(stats),
    profile.joinedAt ? { text: 'On Trakt since', bold: monthYear(profile.joinedAt) } : null,
  ].filter((fact) => fact !== null);
}

/** The owner's own words, pinned first whenever they wrote some. Empty, it only fills a gap. */
export const aboutMeBox = defineProfileBox({
  key: 'about',
  group: 'pinned',
  floor: true,
  component: AboutMeBox,
  score: ({ profile }) => profile.about ? 100 : null,
  view: (input): AboutMeView => {
    const { profile, isSelf } = input;
    if (profile.about) {
      return {
        kind: 'filled',
        about: profile.about,
        vip: vipLabel(profile),
        joined: profile.joinedAt ? monthYear(profile.joinedAt) : null,
      };
    }
    if (isSelf) return { kind: 'self', settingsHref: traktUrls.settings };
    return { kind: 'other', name: profile.firstName, facts: facts(input) };
  },
});
