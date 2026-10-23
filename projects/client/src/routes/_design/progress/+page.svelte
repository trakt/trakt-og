<!--
  The progress page as its owner sees it, on sample shows: the view toggles, each row's status menu (rewatch and drop,
  restore on Dropped) and its Seasons toggle. `?view=grid` shows the poster grid, `?view=simple` the simple bars,
  `?type=rewatching` the Rewatching tab (Game of Thrones) and `?type=dropped` the Dropped tab (two of the sample
  shows). The rows carry their catalogs, so each shows its up-next card at once, and opening one shows its season
  lines (Breaking Bad has unwatched episodes in the library, Severance a season announced); `?estimates` leaves them
  out, for the collapsed counts. The page data's viewer makes the controls live; with a browser session they write to
  that account, so screenshots stub the API.
-->
<script lang="ts">
import { page } from '$app/state';
import DemoSection from '$lib/design/DemoSection.svelte';
import { progressFixture } from '$lib/users/progress/progressFixture';
import ProgressList from '$lib/users/progress/ProgressList.svelte';
import { isProgressType, type ProgressType } from '$lib/users/progress/progressTypes';
import { toProfileUser } from '$lib/users/toProfileUser';

const datePreferences = { order: 'mdy', hour24: false, timeZone: 'America/Los_Angeles', weekStartDay: 0 } as const;
const now = new Date(progressFixture.now);
const profile = toProfileUser({ username: 'demo', name: 'Demo User', private: false, ids: { slug: 'demo' } });

const view = $derived(page.url.searchParams.get('view'));
const expanded = $derived(!page.url.searchParams.has('estimates'));
const type = $derived.by<ProgressType>(() => {
  const value = page.url.searchParams.get('type') ?? '';
  return isProgressType(value) ? value : 'watched';
});
const variants = [
  { label: 'List', query: '' },
  { label: 'Grid', query: '?view=grid' },
  { label: 'Simple', query: '?view=simple' },
  { label: 'Rewatching', query: '?type=rewatching' },
  { label: 'Dropped', query: '?type=dropped' },
  { label: 'Estimates', query: '?estimates' },
];
const items = $derived(progressFixture[type](expanded));
const data = $derived({
  type,
  sort: { by: 'added', how: 'asc' as const, supported: true },
  hide: [],
  grid: view === 'grid',
  simple: view === 'simple',
  terms: '',
  list: undefined,
  page: 1,
  options: { includeSpecials: false, useLastActivity: false },
  datePreferences,
  profile,
  user: page.data.user,
});
</script>

<!-- The variants only change this page's query, so resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<DemoSection title="Progress list" bleed
  note="The list on sample shows, with each row's catalog so its up-next card shows at once. Signed in, the controls write to your account.">
  <nav class="variants" aria-label="Progress variants">
    {#each variants as variant (variant.label)}
      <a href="{page.url.pathname}{variant.query}" aria-current={page.url.search === variant.query ? 'page' : undefined}>
        {variant.label}
      </a>
    {/each}
  </nav>
  <ProgressList {data} {items} {now} />
</DemoSection>

<style>
.variants {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm-inline);
  padding: 0 var(--design-stage-padding) var(--gutter);

  & a {
    padding: var(--space-xs-block) var(--space-sm-inline);
    border: 1px solid var(--color-separator);
    border-radius: var(--radius-round);
    color: inherit;
    text-decoration: none;

    &[aria-current='page'] {
      border-color: var(--brand-primary);
      color: var(--brand-primary);
    }
  }
}
</style>
