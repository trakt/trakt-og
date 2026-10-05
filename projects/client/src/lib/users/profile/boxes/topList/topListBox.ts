import { countLabel } from '../../../../utils/countLabel.ts';
import { imageUrl } from '../../../../utils/imageUrl.ts';
import { boxMath } from '../boxMath.ts';
import { defineProfileBox } from '../defineProfileBox.ts';
import { fetchUserLists } from '../fetchUserLists.ts';
import TopListBox from './TopListBox.svelte';
import type { TopListView } from './TopListView.ts';

type Lists = Awaited<ReturnType<typeof fetchUserLists>>;

/** Lists worth showing off: a list of five or more items, and five or more likes in all, or three or more lists. */
function curated(lists: Lists | undefined) {
  if (!lists || !lists.some((list) => list.item_count >= 5)) return null;
  const likes = lists.reduce((sum, list) => sum + list.likes, 0);
  if (likes < 5 && lists.length < 3) return null;
  const top = lists.toSorted((a, b) => b.likes - a.likes || b.updated_at.localeCompare(a.updated_at)).at(0);
  const updated = lists.map((list) => list.updated_at).toSorted().at(-1);
  return top && updated ? { likes, top, updated, count: lists.length } : null;
}

/** Scores likes across the user's lists (500 is a lot), how many lists, and how recently one changed. */
export const topListBox = defineProfileBox({
  key: 'top-list',
  group: 'image',
  component: TopListBox,
  extra: { load: fetchUserLists, when: ({ stats }) => (stats.lists ?? 0) >= 1 },
  score: ({ today }, lists) => {
    const found = curated(lists);
    if (!found) return null;
    return 100 * (
      0.5 * boxMath.cap(found.likes, 500) +
      0.2 * boxMath.cap(found.count, 15) +
      0.3 * boxMath.fresh(boxMath.daysAgo(today, found.updated), 30)
    );
  },
  view: ({ profile }, lists): TopListView | null => {
    const found = curated(lists);
    if (!found) return null;
    const { top } = found;
    return {
      likes: found.likes.toLocaleString('en-US'),
      lists: countLabel(found.count, 'list'),
      posters: (top.images?.posters ?? []).slice(0, 3).flatMap((poster) => imageUrl(poster, 'thumb') ?? []),
      title: { text: top.name, href: `/users/${profile.slug}/lists/${top.ids.slug}` },
      line: [
        countLabel(top.likes, 'like'),
        countLabel(top.item_count, 'item'),
        countLabel(top.comment_count, 'comment'),
      ]
        .join(' · '),
    };
  },
});
