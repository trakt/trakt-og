import { AnalyticsEvent } from '#lib/analytics/AnalyticsEvent.ts';
import { useTrack } from '#lib/analytics/useTrack.ts';
import type { WatchingNow } from '#lib/users/WatchingNow.ts';
import { GENERIC_ERROR } from '../../utils/genericError.ts';

type Params = {
  watching: Pick<WatchingNow, 'item' | 'title' | 'episode'>;
  /** `DELETE /checkin`, signed in. */
  remove: () => Promise<Response>;
  notify: { success: (message: string) => void; error: (message: string) => void };
  /** Nothing is playing any more: the header's dot and every watching-now bar go away. */
  clear: () => void;
};

const { track } = useTrack(AnalyticsEvent.CheckIn);

/** Cancels the viewer's check-in, saying which. Resolves true when it's gone. A rate limit stays quiet. */
export async function cancelCheckin({ watching, remove, notify, clear }: Params): Promise<boolean> {
  track({ type: watching.item.type, action: 'stop' });
  const response = await remove().catch(() => null);
  if (!response?.ok) {
    if (response?.status !== 429) notify.error(GENERIC_ERROR);
    return false;
  }

  clear();
  const episode = watching.episode
    ? ` ${watching.episode.number}${watching.episode.title ? ` "${watching.episode.title}"` : ''}`
    : '';
  notify.success(`You cancelled your check in for ${watching.title}${episode}.`);
  return true;
}
