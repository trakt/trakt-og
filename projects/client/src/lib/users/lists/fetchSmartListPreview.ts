import { api } from '../../api/api.ts';
import { positiveInt } from '../../utils/positiveInt.ts';
import { imageUrl } from '../../utils/imageUrl.ts';

type Params = { fetch: typeof globalThis.fetch; slug: string };

type Preview = { readonly posters: readonly { title?: string; image?: string }[]; readonly itemCount: number };

/**
 * A smart list's first five titles' posters and how many titles it holds today, for its row. A smart list has no
 * stored count: it's worked out on read. Null when it didn't load, so the row keeps its placeholders.
 */
export async function fetchSmartListPreview({ fetch, slug }: Params): Promise<Preview | null> {
  const response = await api({ fetch })
    .smart_lists.items({ params: { list_id: slug }, query: { extended: 'images', limit: 5 } })
    .catch(() => null);
  if (response?.status !== 200) return null;

  return {
    posters: response.body.slice(0, 5).map(({ movie, show }) => {
      const media = movie ?? show;
      return { title: media?.title, image: imageUrl(media?.images?.poster?.at(0), 'thumb') };
    }),
    itemCount: positiveInt(response.headers.get('x-pagination-item-count'), response.body.length),
  };
}
