<script lang="ts">
import Dialog from '$lib/components/dialog/Dialog.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import DemoSection from '$lib/design/DemoSection.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import WatchNow from '$lib/components/watchnow/WatchNow.svelte';
import type { WatchNowButton } from '$lib/components/watchnow/watchNow';
import Icon from '$lib/icons/Icon.svelte';
import check from '$lib/icons/trakt/check-thick.svg?raw';

const sorts = ['Watched Date', 'Title', 'Released', 'Runtime'];
const placements = ['top', 'right', 'bottom', 'left'] as const;
const plays = '12 plays\n1 day 2 hours'; // lines break at \n, like OG's <br>

let sort = $state('Watched Date');
let reportOpen = $state(false);
let watchOpen = $state(false);

// The modal loads Fight Club's real offers from the API when it opens.
const logo = (slug: string) => `https://media.trakt.tv/watchnow/sources/${slug}.webp`;
const watchNow: WatchNowButton = {
  path: '/movies/fight-club-1999',
  tiles: [
    { slug: 'apple_tv', name: 'Apple TV', color: '#000000', logo: logo('apple_tv'), href: '#apple' },
    {
      slug: 'google_play_movies',
      name: 'Google Play',
      color: '#607d8b',
      logo: logo('google_play_movies'),
      href: '#gp',
    },
  ],
  count: 5,
  favorites: 1,
  cinemaOnly: false,
  hidden: false,
  country: 'us',
  favoriteKeys: ['us-youtube'],
};
</script>

<DemoSection title="Dropdown"
  note="OG's Bootstrap dropdown on the Popover API, then the transparent one on discover's black titles column.">
  <Dropdown>
    {#snippet trigger()}{sort}{/snippet}
    <ul>
      {#each sorts as option (option)}
        <li>
          <button type="button" aria-current={option === sort} onclick={() => (sort = option)}>{option}</button>
        </li>
      {/each}
    </ul>
    <hr />
    <ul>
      <li><a href="#top">A link row</a></li>
    </ul>
  </Dropdown>

  <div class="dark-band">
    <Dropdown variant="transparent" label="Media type: {sort}">
      {#snippet trigger()}{sort}{/snippet}
      <ul>
        {#each sorts as option (option)}
          <li><button type="button" onclick={() => (sort = option)}>{option}</button></li>
        {/each}
      </ul>
    </Dropdown>
  </div>
</DemoSection>

<DemoSection title="Dialog" note="OG's modals on a native dialog element, at two sizes.">
  <div class="row">
    <button type="button" onclick={() => (reportOpen = true)}>Report item (500px)</button>
    <button type="button" onclick={() => (watchOpen = true)}>Watch now (360px, click outside closes)</button>
  </div>
</DemoSection>

<DemoSection title="Watch Now"
  note="The sidebar block under a summary poster. The button opens the where-to-watch modal on Fight Club's real offers.">
  <div class="sidebar-demo">
    <WatchNow button={watchNow} title="Fight Club" year={1999} />
  </div>
</DemoSection>

<DemoSection title="Toast" note="Glass toasts, top right under where the header sits.">
  <div class="row">
    <button type="button" onclick={() => toast.success('Fight Club added to your watchlist.')}>Success</button>
    <button type="button" onclick={() => toast.error('This item was recently refreshed. Please try again later.')}>
      Error
    </button>
  </div>
</DemoSection>

<DemoSection title="Tooltip" note="Hover or tab to a trigger. Esc hides it; touch never opens one.">
  <div class="row tooltips">
    {#each placements as placement (placement)}
      <Tooltip text="Tooltip on {placement}" {placement}>
        {#snippet trigger(tooltip)}
          <button type="button" {...tooltip}>{placement}</button>
        {/snippet}
      </Tooltip>
    {/each}
    <Tooltip text={plays} placement="bottom">
      {#snippet trigger(tooltip)}
        <button type="button" class="icon-button" aria-label="Add to watched history" {...tooltip}>
          <Icon svg={check} />
        </button>
      {/snippet}
    </Tooltip>
    <Tooltip placement="bottom">
      {#snippet trigger(tooltip)}
        <a href="#top" {...tooltip}>Markup inside</a>
      {/snippet}
      <em>Added to library on</em><br />September 1, 2026
    </Tooltip>
    <Tooltip text="A longer tooltip wraps once it reaches OG's 400px limit, which Bootstrap's default of 200px was raised to for titles like these ones.">
      {#snippet trigger(tooltip)}
        <button type="button" {...tooltip}>Long</button>
      {/snippet}
    </Tooltip>
  </div>
</DemoSection>

<Dialog bind:open={reportOpen} title="Report item" size="md">
  <form method="dialog" class="form">
    <label>
      Reason
      <select>
        <option></option>
        <option>Duplicate</option>
        <option>Invalid Metadata</option>
      </select>
    </label>
    <label>
      Message
      <textarea rows="3"></textarea>
    </label>
    <button type="submit">Send</button>
  </form>
</Dialog>

<Dialog bind:open={watchOpen} title="Watch now" lightDismiss>
  <p>Fight Club streams on 2 services in the United States.</p>
</Dialog>

<style>
/* Where the transparent variant sits: discover's black titles column. */
.dark-band {
  margin-block-start: var(--gutter);
  padding: var(--gutter);
  background-color: var(--color-recent-comments-titles-bg);
}

.sidebar-demo {
  inline-size: 173px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm-inline);
}

.tooltips {
  align-items: center;
  gap: var(--gutter);
  padding-block: calc(var(--gutter) * 3);
  padding-inline: calc(var(--gutter) * 2);
}

.icon-button {
  color: var(--brand-tertiary);
  font-size: var(--font-size-quick-icon);
}

.form {
  display: grid;
  gap: var(--space-panel);

  & label {
    display: grid;
    gap: var(--space-sm-block);
  }
}
</style>
