import { api } from '../../../lib/api/api.ts';
import type { OnDeckItem } from '../../../lib/components/media/OnDeckItem.ts';
import { upNextFixture } from '../../../lib/progress/upNextFixture.ts';

/** One show's `/shows/:id/progress/watched`: the whole show for a rewatch, else with an episode skipped halfway. */
function progressOf(id: number) {
  const entry = upNextFixture.entries.find(({ show }) => show.ids.trakt === id);
  const lifetime = upNextFixture.lifetime.find(({ show }) => show.ids.trakt === id);
  if (!entry || !lifetime) return null;

  const { aired, completed } = entry.progress;
  const skipped = Math.floor(completed / 2);
  const watched = (i: number) => entry.progress.reset_at ? true : i !== skipped && i <= completed;
  return {
    ...lifetime.progress,
    seasons: [{
      number: 1,
      aired,
      completed,
      episodes: Array.from({ length: aired }, (_, i) => ({ number: i + 1, completed: watched(i) })),
    }],
  };
}

/** Answers Up Next and each show's progress from the fixture, so the panel loads through the real `fetchUpNext`. */
function upNextWorker(input: Request | URL | string) {
  const url = new URL(input instanceof Request ? input.url : input);
  if (url.pathname.endsWith('/sync/progress/up_next_nitro')) {
    return Promise.resolve(Response.json(upNextFixture.entries));
  }

  const id = Number(url.pathname.match(/\/shows\/(\d+)\/progress\/watched$/)?.at(1));
  const progress = progressOf(id);
  return Promise.resolve(progress ? Response.json(progress) : new Response(null, { status: 404 }));
}

export const upNextClient = api({ fetch: upNextWorker });

/** A show whose last aired episode was just watched, as a card's refresh turns it. */
export function finished(item: OnDeckItem, completionLabel: string): OnDeckItem {
  const { aired, plays } = item.progress;
  return {
    ...item,
    complete: true,
    completionLabel,
    ticks: Array.from({ length: aired }, () => true),
    progress: { aired, completed: aired, plays },
    rewatching: false,
  };
}

/** Severance, caught up on its second season and waiting on its third. */
export const caughtUp: OnDeckItem = finished({
  showId: 154997,
  showTitle: 'Severance',
  showHref: '/shows/severance',
  episodeId: 15_499_710,
  seasonNumber: 2,
  episode: 10,
  episodeHref: '/shows/severance/seasons/2/episodes/10',
  episodeNumber: '2x10',
  episodeTitle: 'Cold Harbor',
  rating: 9.1,
  runtime: 50,
  progressHref: '/users/me/progress?show=154997',
  progress: { aired: 19, completed: 18, plays: 18 },
  rewatching: false,
}, 'Returns next season!');
