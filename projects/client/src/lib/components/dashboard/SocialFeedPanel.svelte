<!--
  The dashboard's Social Feed, under a single Following pill tab: the Earlier timeline of sittings by day, and a
  Comments column when there are any. Pass the unawaited `fetchSocialFeed` promise from the loader, so the page
  streams in and this panel spins until it lands.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import NoData from '$lib/components/empty/NoData.svelte';
import PillTabs from '$lib/components/tabs/PillTabs.svelte';
import type { SocialFeed } from '$lib/dashboard/fetchSocialFeed';
import userGroup from '$lib/icons/regular/user-group.svg?raw';
import DashboardPanel from './DashboardPanel.svelte';
import SocialComment from './SocialComment.svelte';
import SocialRow from './SocialRow.svelte';

const { feed }: { feed: Promise<SocialFeed> } = $props();

const TABS = [{ id: 'following', label: 'Following' }] as const;
const id = $props.id();
const commentId = (comment: number) => `${id}-comment-${comment}`;
</script>

{#snippet panel(loading: boolean, content: Snippet)}
  <DashboardPanel
  --panel-bg="var(--color-social-feed-bg)"
  --panel-padding-end="var(--gutter)"
  title="Social Feed"
  icon={userGroup}
  {loading}
>
  <div class="tabs">
    <PillTabs label="Social Feed" tabs={TABS}>
        {#snippet panel()}
          <div class="body">{@render content()}</div>
        {/snippet}
      </PillTabs>
  </div>
</DashboardPanel>
{/snippet}

{#await feed}
  {@render panel(true, pending)}
{:then social}
  {#snippet body()}
    {#if social.sittings.length === 0}
      <div class="notice">
  <NoData>Follow some Trakt members to see what they're watching.</NoData>
</div>
    {:else}
      <div class="feed">
  <div class={['columns', { wide: social.comments.length === 0 }]}>
          {#if social.sittings.length > 0}
            <section class="column" aria-labelledby="{id}-earlier">
              <h3 id="{id}-earlier">Earlier</h3>
              {#each social.sittings as sitting, i (sitting.key)}
                {#if sitting.summary.day !== social.sittings[i - 1]?.summary.day}
                  <h4 class="day">{sitting.summary.day}</h4>
                {/if}
                <SocialRow {sitting} {commentId} />
              {/each}
            </section>
          {/if}
          {#if social.comments.length > 0}
            <section class="column comments" aria-labelledby="{id}-comments">
              <h3 id="{id}-comments">Comments</h3>
              {#each social.comments as item (item.key)}
                {#if item.comment}<SocialComment {item} id={commentId(item.comment.id)} />{/if}
              {/each}
            </section>
          {/if}
        </div>
</div>
    {/if}
  {/snippet}
  {@render panel(false, body)}
{:catch}
  {@render panel(false, failed)}
{/await}

{#snippet pending()}{/snippet}

{#snippet failed()}
  <div class="notice">
  <NoData>The Social Feed didn't load. Refresh the page to try again.</NoData>
</div>
{/snippet}

<style>
.body {
  --color-no-data-bg: var(--color-social-feed-no-data-bg);
}

/* OG's alert sat in the posters row, which kept 20px above it and, like each card, 20px under it. With the row's own
   20px and the panel's, that leaves 40px under the cards and 60px under the alert. */
.notice {
  padding-block: var(--gutter);
}

/* the panel fades in when its data lands, as OG's lazy panels did. */
.feed {
  padding-block-start: var(--gutter);
  container-type: inline-size;
  animation: fade-in var(--transition-card) ease-out;
}

.columns {
  display: grid;
  grid-template-columns: var(--social-columns);
  gap: var(--social-columns-gap);

  &.wide {
    grid-template-columns: minmax(0, 1fr);
  }
}

h3 {
  margin: 0 0 var(--space-xs-inline);
  color: var(--color-social-muted);
  font-size: var(--font-size-social-chip);
  font-weight: bold;
  letter-spacing: var(--social-heading-tracking);
  text-transform: uppercase;
}

.day {
  margin: 0;
  padding-block: var(--space-lg-block) var(--space-xs-block);
  border-block-end: 1px solid var(--color-social-line);
  color: var(--color-social-faint);
  font-size: var(--font-size-social-chip);
  font-weight: bold;
}

.column {
  min-inline-size: 0;
  background-color: transparent;
}

.comments {
  display: grid;
  gap: var(--space-lg-block);
  align-content: start;
}

@container (width < 860px) {
  .columns {
    grid-template-columns: minmax(0, 1fr);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .feed {
    animation: none;
  }
}
</style>
