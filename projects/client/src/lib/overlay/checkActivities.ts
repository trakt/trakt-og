import { lastActivitiesResponseSchema } from '@trakt/api';
import { contractSchema } from '../api/contractSchema.ts';
import type { SliceName, SliceRecord } from './overlayStorage.ts';
import { SLICE_NAMES } from './sliceNames.ts';
import { type ApiGet, sliceSources } from './sliceSources.ts';
import { staleSlices } from './staleSlices.ts';

const activitiesSchema = contractSchema(lastActivitiesResponseSchema);

type CheckActivitiesParams = {
  get: ApiGet;
  known: () => Readonly<Partial<Record<SliceName, string>>>;
  /** False once the user it runs for signed out or switched. */
  isCurrent: () => boolean;
  onSlice: (record: SliceRecord) => Promise<void>;
  /** A slice that couldn't be fetched this check. */
  onFailed: (name: SliceName) => void;
};

/**
 * Fetches every slice whose `last_activities` key moved. A failed check or slice keeps the cached copy, and reports
 * each slice it couldn't fetch: on a failed check, every one never fetched.
 */
export async function checkActivities({ get, known, isCurrent, onSlice, onFailed }: CheckActivitiesParams) {
  const failUnknown = () => SLICE_NAMES.filter((name) => known()[name] === undefined).forEach(onFailed);
  const response = await get('/sync/last_activities').catch(() => null);
  if (!isCurrent()) return;
  // Keep the cached slices as they are. The next visibility check retries.
  if (!response?.ok) return failUnknown();

  const parsed = activitiesSchema.safeParse(await response.json().catch(() => null));
  // A body that doesn't match the contract is a failed check too.
  if (!parsed.success) return failUnknown();

  const activities = parsed.data;
  const stale = staleSlices(known(), activities);
  const fetchAll = (names: SliceName[]) =>
    Promise.allSettled(
      names.map(async (name) => {
        const activity = sliceSources[name].activity(activities);
        const data = await sliceSources[name].load(get).catch(() => onFailed(name));
        if (data !== undefined) await onSlice({ name, activity, data });
      }),
    );

  // A failed slice keeps its previous copy, or stays unknown. Lists cost a request each, so they go last.
  await fetchAll(stale.filter((name) => name !== 'listMembership'));
  await fetchAll(stale.filter((name) => name === 'listMembership'));
}
