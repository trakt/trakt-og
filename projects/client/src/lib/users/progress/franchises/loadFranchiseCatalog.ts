import type { Franchise } from './Franchise.ts';
import { dedupeFranchises } from './dedupeFranchises.ts';
import { franchisePageSchema } from './franchisePageSchema.ts';

/** One page of the official lists, as the raw request returned it. */
export type FranchisePage =
  | { readonly ok: true; readonly body: unknown; readonly headers: Headers }
  | { readonly ok: false; readonly status: number };

type LoadFranchiseCatalogParams = {
  request: (page: number) => Promise<FranchisePage>;
  /** Pages read at once. */
  concurrency?: number;
};

const CONCURRENCY = 4;

const chunks = <T>(items: readonly T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));

/**
 * Every franchise among the official lists: the first page says how many pages there are, then the rest load a few at
 * a time. Collections holding exactly the same movies count once. A failed page fails the whole read, so the page never shows half the franchises as all of them.
 */
export async function loadFranchiseCatalog({
  request,
  concurrency = CONCURRENCY,
}: LoadFranchiseCatalogParams): Promise<readonly Franchise[]> {
  const read = async (page: number) => {
    const response = await request(page);
    if (!response.ok) throw new Error(`official lists page ${page}: ${response.status}`);
    const parsed = franchisePageSchema.safeParse(response.body);
    if (!parsed.success) throw new Error(`official lists page ${page}: unexpected shape`);
    return { franchises: parsed.data, headers: response.headers };
  };

  const first = await read(1);
  const pages = Number(first.headers.get('x-pagination-page-count') ?? 1) || 1;
  const rest = await chunks(
    Array.from({ length: pages - 1 }, (_, index) => index + 2),
    concurrency,
  ).reduce<Promise<readonly Franchise[]>>(
    async (done, group) => [
      ...(await done),
      ...(await Promise.all(group.map(read))).flatMap((page) => page.franchises),
    ],
    Promise.resolve([]),
  );

  return dedupeFranchises([
    ...new Map([...first.franchises, ...rest].map((franchise) => [franchise.id, franchise])).values(),
  ]);
}
