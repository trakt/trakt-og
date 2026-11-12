<!--
  `/users/:id/network(/:type)` under the profile frame: the subnav with the list picker,
  the people count and the sort menu, then 54 user cards a page with pagination above and below. Each card fills in
  its cover and whether they're watching now once it's on screen, and shimmers in its follow buttons' place until the
  viewer's follow states stream in. When the viewer follows anyone on the page, one call every 2 minutes says what
  all of them are watching; only the other cards ask on their own.
-->
<script lang="ts">
import SeoHead from '#lib/seo/SeoHead.svelte';
import { toNetworkSeo } from '#lib/users/network/toNetworkSeo.ts';
import { page } from '$app/state';
import { apiQueue } from '#lib/api/apiQueue.ts';
import { rawApiFetch } from '#lib/api/rawApiFetch.ts';
import Container from '#lib/components/container/Container.svelte';
import Dropdown from '#lib/components/dropdown/Dropdown.svelte';
import SortDirection from '#lib/components/dropdown/SortDirection.svelte';
import EmptyState from '#lib/components/empty/EmptyState.svelte';
import Pagination from '#lib/components/pagination/Pagination.svelte';
import SectionToolbar from '#lib/components/toolbar/SectionToolbar.svelte';
import SubnavCount from '#lib/components/toolbar/SubnavCount.svelte';
import { fetchFollowingWatching } from '#lib/dashboard/fetchFollowingWatching.ts';
import type { LiveWatch } from '#lib/dashboard/fetchWatching.ts';
import { pollWatching } from '#lib/dashboard/pollWatching.ts';
import userIcon from '#lib/icons/regular/user.svg?raw';
import type { ProfileUser } from '#lib/users/ProfileUser.ts';
import type { ViewerRelation } from '#lib/users/ViewerRelation.ts';
import type { loadNetwork } from './loadNetwork.ts';
import NetworkUserCard from './NetworkUserCard.svelte';
import { type NetworkType, networkTypes } from './networkTypes.ts';
import { viewerFetch } from '../../auth/viewerFetch.ts';

type Props = {
  data: Awaited<ReturnType<typeof loadNetwork>> & { profile: ProfileUser };
};

const { data }: Props = $props();
const seo = $derived(toNetworkSeo({ profile: data.profile, type: data.type }));
const title = $derived(seo.title);
const base = $derived(`/users/${data.profile.slug}/network`);
// OG offers Following (Pending) on your own profile only.
const typeOrder: readonly NetworkType[] = ['following', 'following_pending', 'followers'];
const types = $derived(typeOrder.filter((type) => type !== 'following_pending' || data.isSelf));
const typeHref = (type: NetworkType) => (type === 'following' ? base : `${base}/${type}`);
const relationOf = (relations: Readonly<Record<string, ViewerRelation>> | null, user: ProfileUser) =>
  user.slug === data.viewerSlug ? null : (relations?.[user.slug] ?? null);

const get = (path: string) => apiQueue.run(() => rawApiFetch({ fetch: viewerFetch(), path }));
const bySlug = (live: readonly LiveWatch[]) =>
  new Map(live.flatMap((watch) => (watch.member.slug ? [[watch.member.slug, watch] as const] : [])));

let followedLive = $state<ReadonlyMap<string, LiveWatch>>(new Map());

$effect(() => {
  const relations = data.relations;
  if (!relations) return;

  let stop = () => {};
  let cancelled = false;
  void relations
    .then((found) => {
      const followsAnyone = Object.values(found).some(({ follow }) => follow === 'following');
      if (cancelled || !followsAnyone) return;
      stop = pollWatching({
        load: () => fetchFollowingWatching({ get }),
        onupdate: (live) => (followedLive = bySlug(live)),
      });
    })
    .catch(() => {});

  return () => {
    cancelled = true;
    stop();
  };
});

// A card the viewer follows takes the page's answer; any other card asks on its own.
const followedWatch = (relation: ViewerRelation | null, user: ProfileUser) =>
  relation?.follow === 'following' ? (followedLive.get(user.slug) ?? null) : undefined;
</script>

<!-- List URLs keep the canonical profile slug. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<SeoHead {...seo} />

{#snippet grid(relations: Readonly<Record<string, ViewerRelation>> | null, pending = false)}
  <ul class="cards" aria-busy={pending}>
    {#each data.users as user (user.slug)}
      {@const relation = relationOf(relations, user)}
      <li>
        <NetworkUserCard {user} extra={data.extras[user.slug]} {relation} followedWatch={followedWatch(relation, user)}
          pending={pending && user.slug !== data.viewerSlug} canFollow={data.canFollow} />
      </li>
    {/each}
  </ul>
{/snippet}

<SectionToolbar>
  {#snippet filters()}
    <Dropdown section="Network">
      {#snippet trigger()}{networkTypes[data.type]}{/snippet}
      <ul>
        {#each types as type (type)}
          <li><a href={typeHref(type)} aria-current={data.type === type ? 'page' : undefined}>{networkTypes[type]}</a></li>
        {/each}
      </ul>
    </Dropdown>
  {/snippet}
  {#snippet stats()}
    <SubnavCount svg={userIcon} count={data.itemCount} noun="person" plural="people" tooltip="People" />
  {/snippet}
  {#snippet summary()}
    <span class="sort">
      <Dropdown joined section="Sort">
        {#snippet trigger()}Added Date{/snippet}
        <ul><li><a href={page.url.pathname + page.url.search} aria-current="page">Added Date</a></li></ul>
      </Dropdown>
      <SortDirection joined descending disabled />
    </span>
  {/snippet}
</SectionToolbar>

<section class="network" aria-label={title}>
  <Container>
    {#if data.users.length > 0}
      {#if data.page.type === 'paginated'}<Pagination meta={data.page} label="Network pages" />{/if}
      {#if data.relations}
        {#await data.relations}
          {@render grid(null, true)}
        {:then relations}
          {@render grid(relations)}
        {:catch}
          {@render grid(null)}
        {/await}
      {:else}
        {@render grid(null)}
      {/if}
      {#if data.page.type === 'paginated'}<Pagination meta={data.page} label="Network pages" />{/if}
    {:else}
      <div class="empty"><EmptyState /></div>
    {/if}
  </Container>
</section>

<style>
.sort {
  display: flex;
  align-items: center;
}

.network {
  display: flow-root;
  padding-block-end: var(--gutter);
  container-type: inline-size;

  & :global(nav) {
    margin-block: var(--line-height-computed) 0;
  }
}

.cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--gutter);
  margin: var(--gutter) 0 0;
  padding: 0;
  list-style: none;
}

/* OG's col-sm-6 and col-xs-12, at Bootstrap's md and sm breakpoints (the section spans the viewport). */
@container (width < 992px) {
  .cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container (width < 768px) {
  .cards {
    grid-template-columns: minmax(0, 1fr);
  }
}

.empty {
  padding-block-start: var(--line-height-computed);
}
</style>
