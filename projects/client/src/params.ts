import { defineParams } from '@sveltejs/kit/params';
import { PUBLIC_CALENDARS, type PublicCalendar } from './lib/calendars/publicCalendars.ts';
import { type ChartAlias, type ChartName, chartNames, isChartAlias } from './lib/charts/chartNames.ts';
import { isHistoryType } from './lib/users/history/historyTypes.ts';
import { MY_CALENDARS, type MyCalendar } from './lib/calendars/myCalendars.ts';
import { networkTypes } from './lib/users/network/networkTypes.ts';
import { noteTypes } from './lib/users/notes/noteTypes.ts';
import { isProgressType } from './lib/users/progress/progressTypes.ts';
import { ratingTypes } from './lib/users/ratings/ratingTypes.ts';
import { searchTypes } from './lib/components/header/searchTypes.ts';
import { retiredSearchTypes } from './lib/search/retiredSearchTypes.ts';
import { userCommentMediaTypes } from './lib/users/comments/userCommentMediaTypes.ts';
import { userCommentTypes } from './lib/users/comments/userCommentTypes.ts';

function matchCalendar(param: string): param is PublicCalendar['slug'] {
  return PUBLIC_CALENDARS.some(({ slug }) => slug === param);
}

/** A chart, or one of OG's old names for one, which the loader redirects. */
export function matchChart(param: string): param is ChartName | ChartAlias {
  return chartNames.some((name) => name === param) || isChartAlias(param);
}

const matchHistoryType = isHistoryType;

/** A list's numeric trakt id, as `/lists/:id`, `/watchlist/:id` and `/officiallist/:id` take it. */
function matchListId(param: string): boolean {
  return /^\d+$/.test(param);
}

function matchMyCalendar(param: string): param is MyCalendar['slug'] {
  return MY_CALENDARS.some(({ slug }) => slug === param);
}

/** OG's network sort menu has one option, Added Date (`/users/:id/network/:type/added`). */
function matchNetworkSort(value: string): value is 'added' {
  return value === 'added';
}

function matchNetworkType(value: string): value is keyof typeof networkTypes {
  return Object.hasOwn(networkTypes, value);
}

function matchNoteType(value: string): value is keyof typeof noteTypes {
  return Object.hasOwn(noteTypes, value);
}

const matchProgressType = isProgressType;

/** Ratings media types outrank the route's fallback rest segments. */
const matchRatingType = (param: string) => Object.hasOwn(ratingTypes, param);

/** A `/search/<type>` tab: shows, people, imdb... Shows & Movies is bare `/search`. A retired tab, which redirects. */
function matchSearchType(param: string): boolean {
  return searchTypes.some((type) => type.slug !== '' && type.slug === param) || retiredSearchTypes.includes(param);
}

function matchUserCommentMediaType(value: string): value is keyof typeof userCommentMediaTypes {
  return Object.hasOwn(userCommentMediaTypes, value);
}

/**
 * OG's `/users/:id/comments/:comment_type/:type/:sort_by` segment. The worker only sorts newest first, so Added Date is
 * the one sort og serves; the profile's "All Comments" link spells it out.
 */
function matchUserCommentSort(value: string): value is 'added' {
  return value === 'added';
}

function matchUserCommentType(value: string): value is keyof typeof userCommentTypes {
  return Object.hasOwn(userCommentTypes, value);
}

export const params = defineParams({
  calendar: (param) => (matchCalendar(param) ? param : undefined),
  chart: (param) => (matchChart(param) ? param : undefined),
  historyType: (param) => (matchHistoryType(param) ? param : undefined),
  listId: (param) => (matchListId(param) ? param : undefined),
  myCalendar: (param) => (matchMyCalendar(param) ? param : undefined),
  networkSort: (param) => (matchNetworkSort(param) ? param : undefined),
  networkType: (param) => (matchNetworkType(param) ? param : undefined),
  noteType: (param) => (matchNoteType(param) ? param : undefined),
  progressType: (param) => (matchProgressType(param) ? param : undefined),
  ratingType: (param) => (matchRatingType(param) ? param : undefined),
  searchType: (param) => (matchSearchType(param) ? param : undefined),
  userCommentMediaType: (param) => (matchUserCommentMediaType(param) ? param : undefined),
  userCommentSort: (param) => (matchUserCommentSort(param) ? param : undefined),
  userCommentType: (param) => (matchUserCommentType(param) ? param : undefined),
});
