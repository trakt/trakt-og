import type { Franchise } from './Franchise.ts';
import type { franchiseCatalogStore } from './franchiseCatalogStore.ts';
import { loadFranchiseCatalog, type FranchisePage } from './loadFranchiseCatalog.ts';

type LoadFranchisesParams = {
  store: ReturnType<typeof franchiseCatalogStore>;
  request: (page: number) => Promise<FranchisePage>;
};

/** The franchise catalog from this browser's copy while it's under a day old, else read again and kept. */
export async function loadFranchises({ store, request }: LoadFranchisesParams): Promise<readonly Franchise[]> {
  const kept = store.read();
  if (kept) return kept;
  const franchises = await loadFranchiseCatalog({ request });
  store.write(franchises);
  return franchises;
}
