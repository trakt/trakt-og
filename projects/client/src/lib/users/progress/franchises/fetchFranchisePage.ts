import { apiQueue } from '../../../api/apiQueue.ts';
import { rawApiFetch } from '../../../api/rawApiFetch.ts';
import type { FranchisePage } from './loadFranchiseCatalog.ts';

const PAGE_SIZE = 250;

/** A page of the official lists with every list's item ids (`extended=item_ids`, which the contract doesn't have). */
export async function fetchFranchisePage(page: number): Promise<FranchisePage> {
  const path = `/lists/popular/official?extended=item_ids&limit=${PAGE_SIZE}&page=${page}`;
  const response = await apiQueue.run(() => rawApiFetch({ path }));
  if (response.status !== 200) return { ok: false, status: response.status };
  return { ok: true, body: await response.json(), headers: response.headers };
}
