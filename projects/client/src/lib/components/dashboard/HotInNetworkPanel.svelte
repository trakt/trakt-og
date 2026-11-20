<!--
  Hot in Your Network: what the most people the viewer follows were on, with a period to pick (the week by default).
  It shows once the week has something to show, then stays for every period. It reads from the page's `SocialCircle`,
  which loads the week after the feed lands; a month loads the first time it's picked.
-->
<script lang="ts">
import { trackDrilldowns } from '#lib/analytics/trackDrilldowns.ts';
import Dropdown from '#lib/components/dropdown/Dropdown.svelte';
import LoadFailed from '#lib/components/empty/LoadFailed.svelte';
import Shimmer from '#lib/components/loading/Shimmer.svelte';
import type { SocialCircle } from '#lib/dashboard/socialCircle.svelte.ts';
import type { SocialSpan } from '#lib/dashboard/socialWindows.ts';
import { toCircleEvents } from '#lib/dashboard/toCircleEvents.ts';
import type { SocialItem } from '#lib/dashboard/toSocialItem.ts';
import userGroup from '#lib/icons/regular/user-group.svg?raw';
import CircleHighlights from './CircleHighlights.svelte';
import DashboardPanel from './DashboardPanel.svelte';
import PanelCounts from './PanelCounts.svelte';

const { circle }: { circle: SocialCircle } = $props();

type CircleSpan = Extract<SocialSpan, 'week' | 'month'>;
const SPANS: Readonly<Record<CircleSpan, string>> = { week: 'Week', month: 'Month' };

let span = $state<CircleSpan>('week');
let fetching = $state(false);
let failed = $state(false);

function pick(next: CircleSpan) {
  span = next;
  failed = false;
  if (circle.loaded[next]) return;
  fetching = true;
  void circle
    .load(next)
    .catch(() => {
      if (span === next) failed = true;
    })
    .finally(() => {
      if (span === next) fetching = false;
    });
}

const circleOf = (which: SocialSpan, items: readonly SocialItem[] | undefined) =>
  items && toCircleEvents(items, circle.following, circle.windowsOf(which));
const hasEvents = (events: ReturnType<typeof circleOf>) =>
  events !== undefined && (events.featured !== null || events.standouts.length > 0);
const shown = $derived(hasEvents(circleOf('week', circle.loaded.week)));
const events = $derived(circleOf(span, circle.loaded[span]));
</script>

{#if shown}
  {#snippet count()}
    {#if circle.following !== null}
      <PanelCounts counts={[{ svg: userGroup, count: circle.following, one: 'person you follow',
        many: 'people you follow' }]} />
    {/if}
  {/snippet}
  <DashboardPanel --panel-bg="var(--color-panel-gray)" title="Hot in Your Network" hot loading={fetching}
    aside={count}>
    <div class="circle" {@attach trackDrilldowns({ source: 'social-feed' })}>
      <div class="controls">
        <Dropdown section="Period">
          {#snippet trigger()}{SPANS[span]}{/snippet}
          <ul>
            {#each Object.entries(SPANS) as [key, label] (key)}
              <li><button type="button" aria-current={key === span ? 'true' : undefined}
                  onclick={() => pick(key as CircleSpan)}>{label}</button></li>
            {/each}
          </ul>
        </Dropdown>
      </div>
      {#if failed}
        <div class="notice"><LoadFailed what={SPANS[span]} onretry={() => pick(span)} /></div>
      {:else if events && hasEvents(events)}
        <div class="highlights"><CircleHighlights {events} following={circle.following} now={circle.now} /></div>
      {:else if events}
        <p class="quiet">Nothing three or more of the people you follow were on.</p>
      {:else}
        <div class="highlights"><Shimmer inline="100%" block="var(--social-circle-banner-height)" /></div>
      {/if}
    </div>
  </DashboardPanel>
{/if}

<style>
/* Under its heading, as the feed's dropdowns sit under "Social Feed". */
.circle {
  container-type: inline-size;
  padding-block: var(--space-heading-dropdowns) var(--space-social-circle-end);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-dropdown-row);
  align-items: center;
}

.notice {
  padding-block: var(--gutter);
}

.highlights {
  margin-block-start: var(--space-social-circle-top);
}

.quiet {
  margin: var(--space-social-circle-top) 0 0;
  color: var(--color-card-subtitle);
}
</style>
