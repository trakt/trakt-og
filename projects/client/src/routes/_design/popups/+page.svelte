<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import DialogArtHeader from '$lib/components/dialog/DialogArtHeader.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import FilterMenu from '$lib/components/filters/FilterMenu.svelte';
import ReportDialog from '$lib/components/summary/ReportDialog.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import LibraryTip from '$lib/components/collection/LibraryTip.svelte';
import PlaysTip from '$lib/components/media/PlaysTip.svelte';
import ProgressTip from '$lib/components/media/ProgressTip.svelte';
import { progressTooltip } from '$lib/components/media/progressTooltip';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import WatchNow from '$lib/components/watchnow/WatchNow.svelte';
import WatchNowDialog from '$lib/components/watchnow/WatchNowDialog.svelte';
import DemoButton from '$lib/design/DemoButton.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';
import Icon from '$lib/icons/Icon.svelte';
import ellipsis from '$lib/icons/regular/ellipsis.svg?raw';
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
const tasteTags = [{ text: '2 of 5 services' }, { text: '3 of 5 genres' }];
// Lines break at \n, like OG's <br>.
const tips = {
  certification: 'Parents Strongly Cautioned\nAges 13+ Recommended',
  era: '2008 to 2015: 23 credits, best known for Breaking Bad',
  votes: '12,345 votes',
};
const rewatch = progressTooltip({
  progress: { aired: 20, completed: 12, plays: 12, minutesWatched: 480, minutesLeft: 320 },
  fullProgress: { aired: 20, completed: 20, plays: 32, minutesWatched: 1280, minutesLeft: 0 },
});
const day = [
  {
    label: 'Monday — Sep 29',
    value: '2h 14m',
    lines: [
      { text: '3 episodes (4 plays)', detail: '1h 7m', color: 'var(--color-minutes-episode)' },
      { text: '1 movie', detail: '1h 7m', color: 'var(--color-minutes-movie)' },
    ],
  },
];
const library = {
  added: 'Mar 4, 2024',
  metadata: { media_type: 'bluray', resolution: 'uhd_4k', hdr: 'hdr10', audio: 'dolby_atmos', audio_channels: '7.1' },
  sources: ['plex' as const],
};
const showLibrary = { episodes: { done: 27, aired: 32 }, sources: ['plex' as const] };
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
  note="The art dialogs: the item's fanart under glass, with the form below. Report sends to the stubbed API; Where to watch loads Fight Club's real offers, with shimmering tiles until they land.">
  <Variant label="md: Report">
    <DemoButton onclick={() => (reportOpen = true)}>Report Fight Club</DemoButton>
  </Variant>
  <Variant label="xl, click outside closes: Where to watch">
    <DemoButton onclick={() => (watchOpen = true)}>Where to watch Fight Club</DemoButton>
  </Variant>
</Specimen>

<Specimen title="Art header" row
  note="Tune your picks' header at the art dialogs' width. While its art loads, the title and tags already show.">
  <Variant label="Loaded">
    <div class="art-header">
      <DialogArtHeader id="art-header-loaded" title="Tune your picks" fanart={data.fanart} tags={tasteTags} />
    </div>
  </Variant>
  <Variant label="Loading">
    <div class="art-header">
      <DialogArtHeader id="art-header-loading" title="Tune your picks" tags={tasteTags} loading />
    </div>
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
    <DemoButton onclick={() => toast.success('Fight Club added to your watchlist.')}>Success</DemoButton>
    <DemoButton onclick={() => toast.error('This item was recently refreshed. Please try again later.')}>Error</DemoButton>
  </div>
</Specimen>

<Specimen title="Tooltip" row
  note="Hover or tab to a trigger; Esc hides it and touch never opens one, except a chart's, which a click or tap toggles. Text centers and balances its lines; stats with lines, and the library card, align left. Near the screen's edge it flips side. A tooltip that only repeats its trigger's name isn't linked as its description, so screen readers say it once.">
  <Variant label="Plays, a movie's quick icon">
    <Tooltip placement="bottom">
      {#snippet trigger(tooltip)}
        <DemoButton aria-label="Add to watched history" {...tooltip}><Icon svg={check} /></DemoButton>
      {/snippet}
      <PlaysTip plays={{ count: 3, minutes: 390 }} />
    </Tooltip>
  </Variant>
  <Variant label="Text, a certification">
    <Tooltip text={tips.certification}>
      {#snippet trigger(tooltip)}<span class="start site" {...tooltip}>PG-13</span>{/snippet}
    </Tooltip>
  </Variant>
  <Variant label="Text that wraps, a career era">
    <Tooltip text={tips.era} placement="right">
      {#snippet trigger(tooltip)}<DemoButton {...tooltip}>2008</DemoButton>{/snippet}
    </Tooltip>
  </Variant>
  <Variant label="Left, a filter's site logo">
    <Tooltip placement="left">
      {#snippet trigger(tooltip)}<span class="start site" {...tooltip}>RT</span>{/snippet}
      Rotten Tomatoes<br /><em>Tomatometer</em>
    </Tooltip>
  </Variant>
  <Variant label="Text, a rating's votes">
    <Tooltip text={tips.votes}>
      {#snippet trigger(tooltip)}<a class="start" href="#tooltip" {...tooltip}>79%</a>{/snippet}
    </Tooltip>
  </Variant>
  <Variant label="Progress, a rewatch">
    <Tooltip placement="bottom">
      {#snippet trigger(tooltip)}<a class="start" href="#tooltip" {...tooltip}>60%</a>{/snippet}
      <ProgressTip progress={rewatch} />
    </Tooltip>
  </Variant>
  <Variant label="Library, with its logos and server">
    <Tooltip placement="bottom">
      {#snippet trigger(tooltip)}<DemoButton aria-label="In library" {...tooltip}>Library</DemoButton>{/snippet}
      <LibraryTip tip={library} />
    </Tooltip>
  </Variant>
  <Variant label="Library, a show's progress">
    <Tooltip placement="bottom">
      {#snippet trigger(tooltip)}<DemoButton aria-label="84% in library" {...tooltip}>Show</DemoButton>{/snippet}
      <LibraryTip tip={showLibrary} />
    </Tooltip>
  </Variant>
  <Variant label="Chart, a day's bar">
    <Tooltip toggles stats={day}>
      {#snippet trigger(tooltip)}<a class="bar" href="#tooltip" aria-label="Monday, Sep 29" {...tooltip}></a>{/snippet}
    </Tooltip>
  </Variant>
</Specimen>

<ReportDialog bind:open={reportOpen} target={report} />
<WatchNowDialog bind:open={watchOpen} button={watchNow} title={fightClub.title} year={fightClub.year}
  fanart={data.fanart} />

<style>
/* The header's own width and corners, as the dialog around it gives them. */
.art-header {
  inline-size: var(--dialog-width-art-list);
  max-inline-size: 100%;
  overflow: hidden;
  border-radius: var(--radius-dialog);
}

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
