import { lastActivitiesResponseSchema } from '@trakt/api';
import { contractSchema } from '../api/contractSchema.ts';
import type { SliceName, SliceRecord } from './overlayStorage.ts';
import { type ApiGet, sliceSources } from './sliceSources.ts';
import { staleSlices } from './staleSlices.ts';

const activitiesSchema = contractSchema(lastActivitiesResponseSchema);

type CheckActivitiesParams = {
  get: ApiGet;
  known: () => Readonly<Partial<Record<SliceName, string>>>;
  /** False once the user it runs for signed out or switched. */
  isCurrent: () => boolean;
  onSlice: (record: SliceRecord) => Promise<void>;
};

/** Fetches every slice whose `last_activities` key moved. A failed check or slice keeps the cached copy. */
export async function checkActivities({ get, known, isCurrent, onSlice }: CheckActivitiesParams) {
  const response = await get('/sync/last_activities').catch(() => null);
  // Keep the cached slices as they are. The next visibility check retries.
  if (!response?.ok || !isCurrent()) return;

  const parsed = activitiesSchema.safeParse(await response.json().catch(() => null));
  // A body that doesn't match the contract is a failed check too.
  if (!parsed.success) return;

  const activities = parsed.data;
  const stale = staleSlices(known(), activities);
  const fetchAll = (names: SliceName[]) =>
    Promise.allSettled(names.map(async (name) => {
      const activity = sliceSources[name].activity(activities);
      await onSlice({ name, activity, data: await sliceSources[name].load(get) });
    }));

  // A failed slice keeps its previous copy, or stays unknown. Lists cost a request each, so they go last.
  await fetchAll(stale.filter((name) => name !== 'listed'));
  await fetchAll(stale.filter((name) => name === 'listed'));
}
