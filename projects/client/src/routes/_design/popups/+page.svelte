<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import FilterMenu from '$lib/components/filters/FilterMenu.svelte';
import ReportDialog from '$lib/components/summary/ReportDialog.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import WatchNow from '$lib/components/watchnow/WatchNow.svelte';
import WatchNowDialog from '$lib/components/watchnow/WatchNowDialog.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';
import Icon from '$lib/icons/Icon.svelte';
import ellipsis from '$lib/icons/regular/ellipsis.svg?raw';
import flag from '$lib/icons/solid/flag.svg?raw';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import { fightClub, reportTarget, watchNow } from './fixtures.ts';

const { data } = $props();
const report = $derived({ ...reportTarget, fanart: data.fanart });

const sorts = ['Watched Date', 'Title', 'Released', 'Runtime'];
const calendars = { my: ['Shows & Movies', 'Shows', 'Movies'], all: ['Shows & Movies', 'Shows', 'Movies'] };

let sort = $state('Watched Date');
let calendar = $state({ group: 'my', name: 'Shows & Movies' });
let movies = $state(true);
let shows = $state(true);
let reportOpen = $state(false);
let watchOpen = $state(false);
// Lines break at \n, like OG's <br>.
const tips = {
  plays: '12 plays\nLast watched Sep 29, 2026',
  rating: 'Trakt Rating\n12,345 votes',
  chart: 'Monday, Sep 29\n2h 14m',
};
</script>

<Specimen title="Dropdown" row
  note="Every look a page uses. Click or press Enter to open; Esc or a click outside closes it.">
  <Variant label="Default, in a section toolbar">
    <div class="toolbar">
      <Dropdown section="Sort">
        {#snippet trigger()}{sort}{/snippet}
        <ul>
          {#each sorts as option (option)}
            <li>
              <button type="button" aria-current={option === sort} onclick={() => (sort = option)}>{option}</button>
            </li>
          {/each}
        </ul>
      </Dropdown>
    </div>
  </Variant>
  <Variant label="Title, a sidebar's page picker">
    <div class="sidebar">
      <Dropdown variant="title" label="Pick a calendar">
        {#snippet trigger()}<span class="eyebrow">{calendar.group === 'my' ? 'My' : 'All'}</span><span class="name"
          >{calendar.name}</span>{/snippet}
        {#each Object.entries(calendars) as [group, names] (group)}
          <ul>
            <li class="header">{group === 'my' ? 'My' : 'All'}</li>
            {#each names as name (name)}
              <li>
                <button type="button" aria-current={calendar.group === group && calendar.name === name}
                  onclick={() => (calendar = { group, name })}>{name}</button>
              </li>
            {/each}
          </ul>
        {/each}
      </Dropdown>
    </div>
  </Variant>
  <Variant label="Circle, after a profile name">
    <div class="start cover">
      <Dropdown variant="circle" label="User options">
        {#snippet trigger()}<Icon svg={ellipsis} />{/snippet}
        <ul>
          <li><button type="button" onclick={() => toast.success('Unfollowed, on this page only.')}>Unfollow</button></li>
          <li><button type="button" onclick={() => toast.success('Blocked, on this page only.')}>Block</button></li>
        </ul>
      </Dropdown>
    </div>
  </Variant>
  <Variant label="Icon, the filter eye">
    <div class="toolbar">
      <FilterMenu active={!movies || !shows} count={Number(!movies) + Number(!shows)}>
        <ul>
          <li class="header" role="presentation">Types</li>
          <li><button type="button" aria-pressed={movies} onclick={() => (movies = !movies)}>Movies</button></li>
          <li><button type="button" aria-pressed={shows} onclick={() => (shows = !shows)}>Shows</button></li>
        </ul>
      </FilterMenu>
    </div>
  </Variant>
</Specimen>

<Specimen title="Dialog" row
  note="The art dialogs: the item's fanart under glass, with the form below. Report sends to the stubbed API; Where to watch loads Fight Club's real offers.">
  <Variant label="md: Report">
    <button type="button" class="start" onclick={() => (reportOpen = true)}>Report Fight Club</button>
  </Variant>
  <Variant label="xl, click outside closes: Where to watch">
    <button type="button" class="start" onclick={() => (watchOpen = true)}>Where to watch Fight Club</button>
  </Variant>
</Specimen>

<Specimen title="Watch Now" bleed
  note="The block under a summary poster, at the sidebar's width. Its button opens the where-to-watch dialog.">
  <Container>
    <div class="summary-sidebar">
      <WatchNow button={watchNow} title={fightClub.title} year={fightClub.year} fanart={data.fanart} />
    </div>
  </Container>
</Specimen>

<Specimen title="Toast" note="Glass toasts, top right under where the header sits.">
  <div class="buttons">
    <button type="button" onclick={() => toast.success('Fight Club added to your watchlist.')}>Success</button>
    <button type="button" onclick={() => toast.error('This item was recently refreshed. Please try again later.')}>
      Error
    </button>
  </div>
</Specimen>

<Specimen title="Tooltip" row
  note="Hover or tab to a trigger; Esc hides it and touch never opens one. Chart tips also open on a click or tap.">
  <Variant label="Bottom, a quick icon">
    <Tooltip text={tips.plays} placement="bottom">
      {#snippet trigger(tooltip)}
        <button type="button" class="start quick-icon" aria-label="Add to watched history" {...tooltip}>
          <Icon svg={check} />
        </button>
      {/snippet}
    </Tooltip>
  </Variant>
  <Variant label="Right, a summary tool">
    <Tooltip text="Report" placement="right">
      {#snippet trigger(tooltip)}
        <button type="button" class="start" aria-label="Report" {...tooltip}><Icon svg={flag} /></button>
      {/snippet}
    </Tooltip>
  </Variant>
  <Variant label="Left, a filter's site logo">
    <Tooltip placement="left">
      {#snippet trigger(tooltip)}<span class="start site" {...tooltip}>RT</span>{/snippet}
      Rotten Tomatoes<br /><em>Tomatometer</em>
    </Tooltip>
  </Variant>
  <Variant label="Titled, the ratings strip">
    <Tooltip text={tips.rating} variant="titled">
      {#snippet trigger(tooltip)}<a class="start" href="#tooltip" {...tooltip}>86%</a>{/snippet}
    </Tooltip>
  </Variant>
  <Variant label="Chart, a day's bar">
    <Tooltip variant="chart" text={tips.chart}>
      {#snippet trigger(tooltip)}<a class="bar" href="#tooltip" aria-label="Monday, Sep 29" {...tooltip}></a>{/snippet}
    </Tooltip>
  </Variant>
  <Variant label="Long text">
    <Tooltip
      text="A longer tooltip wraps once it reaches OG's 400px limit, which Bootstrap's default of 200px was raised to for titles like these ones.">
      {#snippet trigger(tooltip)}<button type="button" class="start" {...tooltip}>Long</button>{/snippet}
    </Tooltip>
  </Variant>
</Specimen>

<ReportDialog bind:open={reportOpen} target={report} />
<WatchNowDialog bind:open={watchOpen} button={watchNow} title={fightClub.title} year={fightClub.year}
  fanart={data.fanart} />

<style>
/* Triggers keep their own width in a Variant's column. */
.start {
  justify-self: start;
}

.toolbar {
  display: flex;
  padding: var(--toolbar-padding) var(--gutter);
  background: var(--color-toolbar-bg);
}

.sidebar {
  inline-size: var(--sidebar-width);
  padding: var(--sidebar-padding-top) var(--sidebar-padding) var(--sidebar-padding);
  background-color: var(--color-sidebar-bg);
  color: var(--color-frame-ink);
}

.cover {
  padding: var(--gutter);
  background-color: var(--color-page);
  color: var(--color-text-inverse);
}

.summary-sidebar {
  inline-size: calc(var(--summary-offset) - var(--gutter));
  padding-block: var(--gutter);
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm-inline);
}

.quick-icon {
  color: var(--brand-tertiary);
  font-size: var(--font-size-quick-icon);
}

.site {
  font-weight: var(--font-weight-headings-heavy);
}

.bar {
  display: block;
  inline-size: var(--gutter);
  block-size: calc(var(--gutter) * 3);
  background-color: var(--brand-primary);
}
</style>
