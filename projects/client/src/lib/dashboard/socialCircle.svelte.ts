/* eslint-disable svelte/prefer-svelte-reactivity -- each Date is replaced, never mutated, and `opened` never changes */
import { apiQueue } from '#lib/api/apiQueue.ts';
import { rawApiFetch } from '#lib/api/rawApiFetch.ts';
import type { DatePreferences } from '#lib/settings/DatePreferences.ts';
import { viewerFetch } from '../auth/viewerFetch.ts';
import { fetchFollowingWatching } from './fetchFollowingWatching.ts';
import { fetchSocialItems, type SocialFeed, type SocialGet } from './fetchSocialFeed.ts';
import type { LiveWatch } from './fetchWatching.ts';
import { liveTiles } from './liveTiles.ts';
import { pollWatching } from './pollWatching.ts';
import { type SocialSpan, socialWindows } from './socialWindows.ts';
import type { SocialItem } from './toSocialItem.ts';

type PastSpan = Exclude<SocialSpan, 'today'>;

type Params = {
  /** The unawaited `fetchSocialFeed` promise from the loader: today's rows. */
  feed: Promise<SocialFeed>;
  datePreferences: DatePreferences;
  /** How many people the viewer follows, for the featured title's share; null when that didn't load. */
  following: number | null;
  /** Who the viewer follows is watching now. Defaults to asking the API with the viewer's token. */
  watching?: () => Promise<readonly LiveWatch[]>;
  /** The rows of a period past today. Defaults to asking the API with the viewer's token. */
  rowsFor?: (span: PastSpan) => Promise<readonly SocialItem[]>;
};

const CLOCK_MS = 30_000;

/**
 * What the dashboard's social panels share, so each can sit anywhere on the page: today's feed, the past periods
 * they've loaded (each loads once for all of them), who's watching now and a clock for the minutes left.
 * `start` begins the reads that follow the feed.
 */
export class SocialCircle {
  readonly feed: Promise<SocialFeed>;
  readonly datePreferences: DatePreferences;
  readonly following: number | null;
  /** The windows' anchor: fixed for the page, so a period's rows and its history links agree. */
  readonly opened = new Date();
  live = $state<readonly LiveWatch[]>([]);
  now = $state(new Date());
  loaded = $state<Partial<Record<PastSpan, readonly SocialItem[]>>>({});
  readonly tiles = $derived(liveTiles(this.live, this.now));

  readonly #watching: () => Promise<readonly LiveWatch[]>;
  readonly #rowsFor: (span: PastSpan) => Promise<readonly SocialItem[]>;
  readonly #requests: Partial<Record<PastSpan, Promise<readonly SocialItem[]>>> = {};

  constructor({ feed, datePreferences, following, watching, rowsFor }: Params) {
    this.feed = feed;
    this.datePreferences = datePreferences;
    this.following = following;
    const get: SocialGet = (path) => apiQueue.run(() => rawApiFetch({ fetch: viewerFetch(), path }));
    this.#watching = watching ?? (() => fetchFollowingWatching({ get }));
    this.#rowsFor = rowsFor ?? ((span) => fetchSocialItems({ get, windows: this.windowsOf(span), datePreferences }));
  }

  windowsOf = (span: SocialSpan) => socialWindows(span, this.opened, this.datePreferences.timeZone);

  /** A past period's rows, read once for every panel. A failed read is dropped, so asking again retries. */
  load(span: PastSpan): Promise<readonly SocialItem[]> {
    const request =
      this.#requests[span] ??
      this.#rowsFor(span).then((items) => {
        this.loaded = { ...this.loaded, [span]: items };
        return items;
      });
    this.#requests[span] = request;
    request.catch(() => delete this.#requests[span]);
    return request;
  }

  /**
   * Once the feed lands and the viewer follows anyone: who's watching, now and every 2 minutes while visible, and the
   * week, for Hot in Your Network. The clock runs from the start. Returns the stop.
   */
  start(): () => void {
    let stopPolling = () => {};
    let cancelled = false;
    void this.feed
      .then(({ follows }) => {
        if (cancelled || !follows) return;
        stopPolling = pollWatching({
          load: this.#watching,
          onupdate: (value) => {
            this.live = value;
            this.now = new Date();
          },
        });
        return this.load('week');
      })
      .catch(() => {});
    const clock = setInterval(() => (this.now = new Date()), CLOCK_MS);

    return () => {
      cancelled = true;
      stopPolling();
      clearInterval(clock);
    };
  }
}
