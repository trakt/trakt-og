import type { ReactionsSummaryResponse } from '@trakt/api';
import { SvelteMap } from 'svelte/reactivity';
import { z } from 'zod/v4';
import { loadCommentReactions } from './loadCommentReactions.ts';
import { patchReactionSummary } from './patchReactionSummary.ts';
import { GENERIC_ERROR } from '../../utils/genericError.ts';
import type { ReactionType } from './ReactionType.ts';

type SummaryReader = (id: number, fresh?: boolean) => Promise<ReactionsSummaryResponse | undefined>;
const empty = (): ReactionsSummaryResponse => ({ reaction_count: 0, user_count: 0, distribution: {} });
const errorSchema = z.object({ message: z.string() });

/** Client-only session state: one viewer read, shared per-comment choices, totals and serialized optimistic writes. */
export function createCommentReactions({ request, notify }: {
  request: (path: string, init?: RequestInit) => Promise<Response>;
  notify: (message: string) => void;
}) {
  let viewer: string | null = null;
  let generation = $state(0);
  let loaded = $state(false);
  const choices = new SvelteMap<number, ReactionType>();
  const summaries = new SvelteMap<number, ReactionsSummaryResponse>();
  const busy = new SvelteMap<number, boolean>();
  let loading: Promise<boolean> | undefined;
  // Pending promises are bookkeeping, not UI state.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const summaryRequests = new Map<number, Promise<void>>();

  const start = (sub: string | null): Promise<boolean> => {
    if (viewer === sub) return loading ?? Promise.resolve(loaded);
    viewer = sub;
    const current = ++generation;
    loaded = false;
    choices.clear();
    busy.clear();
    // A previous session's pending patches must not survive a viewer change.
    summaries.clear();
    summaryRequests.clear();
    if (!sub) {
      loading = undefined;
      return Promise.resolve(false);
    }
    loading = loadCommentReactions(request).then((rows) => {
      if (current !== generation) return false;
      choices.clear();
      for (const [id, type] of rows) choices.set(id, type);
      loaded = true;
      return true;
    }).catch(() => false);
    return loading;
  };

  const loadSummary = (id: number, likes: number, read: SummaryReader, session = generation): Promise<void> => {
    if (session !== generation) return Promise.resolve();
    if (summaries.has(id)) return Promise.resolve();
    const pending = summaryRequests.get(id);
    if (pending) return pending;
    if (likes <= 0) {
      summaries.set(id, empty());
      return Promise.resolve();
    }
    const current = generation;
    const task = read(id).then((summary) => {
      if (current === generation && summary) summaries.set(id, summary);
    }).catch(() => {}).finally(() => {
      if (current === generation) summaryRequests.delete(id);
    });
    summaryRequests.set(id, task);
    return task;
  };

  const ready = async () => {
    const result = await loading;
    if (result && loaded) return true;
    notify('Doh! We could not load your reactions. Please reload and try again.');
    return false;
  };

  // Patches only this comment; another card's concurrent change survives a rollback.
  const patch = (id: number, next: ReactionType | undefined) => {
    const previous = choices.get(id);
    const oldSummary = summaries.get(id);
    const choose = (choice: ReactionType | undefined) => {
      if (choice) choices.set(id, choice);
      else choices.delete(id);
    };
    choose(next);
    if (oldSummary) {
      summaries.set(id, patchReactionSummary({ summary: oldSummary, previous, next }));
    }
    return () => {
      choose(previous);
      if (oldSummary) summaries.set(id, oldSummary);
    };
  };

  const change = async ({ id, type, likes, read }: {
    id: number;
    type: ReactionType;
    likes: number;
    read: SummaryReader;
  }): Promise<boolean> => {
    if (busy.get(id) === true || !loaded) return false;
    const current = generation;
    busy.set(id, true);
    await loadSummary(id, likes, read);
    if (current !== generation) return false;
    const previous = choices.get(id);
    const next = previous === type ? undefined : type;
    const rollback = patch(id, next);
    let message = GENERIC_ERROR;
    try {
      // API's typed delete also unlikes; delete-all skips that step.
      const response = await request(`/comments/${id}/reactions/${type}`, {
        method: next ? 'POST' : 'DELETE',
      });
      if (!response.ok) {
        const body = errorSchema.safeParse(await response.json().catch(() => null));
        message = body.success
          ? body.data.message
          : response.status === 409
          ? 'Doh! You are banned from reacting.'
          : GENERIC_ERROR;
        throw new Error(message);
      }
      // Both writes return no content. Re-read the public summary to reconcile concurrent members' reactions.
      const summary = await read(id, true).catch(() => undefined);
      if (current === generation && summary) summaries.set(id, summary);
      return true;
    } catch {
      if (current !== generation) return false;
      rollback();
      notify(message);
      return false;
    } finally {
      if (current === generation) busy.set(id, false);
    }
  };

  return {
    get session() {
      return generation;
    },
    start,
    ready,
    loadSummary,
    change,
    state: (id: number) => ({ reaction: choices.get(id), summary: summaries.get(id), busy: busy.get(id) === true }),
  };
}
