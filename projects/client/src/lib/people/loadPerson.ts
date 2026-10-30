import { redirect } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import { assertOk } from '../api/assertOk.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { HeaderUser } from '../components/header/HeaderUser.ts';
import { loadPrivateNote } from '../notes/loadPrivateNote.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import type { ViewerSettings } from '../settings/ViewerSettings.ts';
import { type KnownForItem, knownForSchema } from './knownForSchema.ts';
import { toBirthday } from './toBirthday.ts';
import { toCreditsQuery } from './toCreditsQuery.ts';
import { toPersonSummary } from './toPersonSummary.ts';
import { okBody } from '../api/okBody.ts';
import { dayIn } from '../utils/dayIn.ts';

type LoadPersonParams = {
  fetch: typeof fetch;
  /** Only for the viewer's private note. */
  token: string | null;
  /** The layout's data, for the viewer's actor-spoiler settings and note dates. */
  parent: () => Promise<{ settings: ViewerSettings | null; user: HeaderUser | null; datePreferences: DatePreferences }>;
  id: string;
  /** The page URL's query: OG's `?sort=`, `?display=` and `?terms=`, so a shared view renders filtered. */
  search: URLSearchParams;
};

/** The API's known-for picks, or none when the call fails, the person has none (a 204) or the body doesn't parse. */
async function knownFor(fetcher: typeof fetch, id: string): Promise<KnownForItem[]> {
  const response = await rawApiFetch({ fetch: fetcher, path: `/people/${id}/known_for` }).catch(() => null);
  if (!response?.ok) return [];
  const parsed = knownForSchema.safeParse(await response.json().catch(() => null));
  return parsed.success ? parsed.data : [];
}

/**
 * Loads `/people/:id` for SSR: the person, the layout data, the movie and show credits, the known-for picks, the list
 * count and the private note in parallel, with the 404 and canonical redirect checked before the rest is used. Only the note sends the user's token.
 */
export async function loadPerson({ fetch, token, parent, id: requested, search }: LoadPersonParams) {
  const client = api({ fetch });
  const summaryRead = client.people.summary({ params: { id: requested }, query: { extended: 'full,images,markdown' } });
  const layout = parent();
  // The extras go by the requested id alongside the summary, not after it; a non-canonical id redirects before they're
  // used. Each resolves to null on failure, and the catch only stops a failed summary leaving them unhandled.
  const id = requested;
  const extras = Promise.all([
    okBody(client.people.movies({ params: { id }, query: { extended: 'full,images' } })),
    okBody(client.people.shows({ params: { id }, query: { extended: 'full,images' } })),
    knownFor(fetch, id),
    client.people.lists({ params: { id, type: 'all', sort: 'popular' }, query: { limit: 1 } }).catch(() => null),
    Promise.all([summaryRead, layout]).then(([summary, { user }]) =>
      summary.status === 200
        ? loadPrivateNote({
            fetch,
            token: user ? token : null,
            item: { type: 'person', id: summary.body.ids.trakt, slug: summary.body.ids.slug } as const,
          })
        : null,
    ),
  ]);
  extras.catch(() => {});

  const [summary, { settings, user, datePreferences }] = await Promise.all([summaryRead, layout]);
  assertOk(summary, 'Person');

  const person = summary.body;
  if (requested !== person.ids.slug) {
    redirect(301, `/people/${person.ids.slug}${search.size > 0 ? `?${search}` : ''}`);
  }
  const notable = { type: 'person', id: person.ids.trakt, slug: person.ids.slug } as const;

  const [movies, shows, picks, lists, note] = await extras;

  const now = new Date();
  const view = toPersonSummary({
    person,
    movies,
    shows,
    knownFor: picks,
    listCount: lists?.status === 200 ? Number(lists.headers.get('x-pagination-item-count')) || 0 : 0,
    random: Math.random(),
    now,
  });

  return {
    person: view,
    // On their birthday in the viewer's time zone, so it turns at the viewer's midnight.
    birthday: toBirthday({
      birthday: person.birthday,
      death: person.death,
      today: dayIn(now, datePreferences.timeZone),
    }),
    query: toCreditsQuery(search),
    // OG's `display_actor_episode_counts`.
    hideEpisodeCounts: settings?.browsing?.spoilers?.actors === 'hide',
    privateNotes: {
      item: { ...notable, title: person.name, fanart: view.fanart?.image },
      note,
      signedIn: user !== null,
      datePreferences,
    },
  };
}
