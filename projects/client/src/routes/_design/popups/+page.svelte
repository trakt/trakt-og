<script lang="ts">
import Container from '#lib/components/container/Container.svelte';
import DialogArtHeader from '#lib/components/dialog/DialogArtHeader.svelte';
import Dropdown from '#lib/components/dropdown/Dropdown.svelte';
import SortLabel from '#lib/components/sort/SortLabel.svelte';
import SortMenu from '#lib/components/sort/SortMenu.svelte';
import { withTraktSorts } from '#lib/components/sort/sortMenu.ts';
import FilterMenu from '#lib/components/filters/FilterMenu.svelte';
import ReportDialog from '#lib/components/summary/ReportDialog.svelte';
import { toast } from '#lib/components/toast/toast.svelte.ts';
import LibraryTip from '#lib/components/collection/LibraryTip.svelte';
import ListedTip from '#lib/components/lists/ListedTip.svelte';
import PlaysTip from '#lib/components/media/PlaysTip.svelte';
import FavoritedTip from '#lib/components/favorites/FavoritedTip.svelte';
import ChartTip from '#lib/components/tooltip/ChartTip.svelte';
import TooltipBar from '#lib/components/tooltip/TooltipBar.svelte';
import TooltipBox from '#lib/components/tooltip/TooltipBox.svelte';
import TooltipHeader from '#lib/components/tooltip/TooltipHeader.svelte';
import ProgressTip from '#lib/components/media/ProgressTip.svelte';
import { progressTooltip } from '#lib/components/media/progressTooltip.ts';
import Stat from '#lib/components/stats/Stat.svelte';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import WatchNow from '#lib/components/watchnow/WatchNow.svelte';
import WatchNowDialog from '#lib/components/watchnow/WatchNowDialog.svelte';
import DemoButton from '#lib/design/DemoButton.svelte';
import Specimen from '#lib/design/Specimen.svelte';
import Variant from '#lib/design/Variant.svelte';
import Icon from '#lib/icons/Icon.svelte';
import ellipsis from '#lib/icons/regular/ellipsis.svg?raw';
import completeCheck from '#lib/icons/solid/check.svg?raw';
import hourglass from '#lib/icons/regular/hourglass-half.svg?raw';
import check from '#lib/icons/trakt/check-thick.svg?raw';
import { fightClub, reportTarget, watchNow } from './fixtures.ts';

const { data } = $props();
const report = $derived({ ...reportTarget, fanart: data.fanart });

const sorts = ['Watched Date', 'Title', 'Released', 'Runtime'];
const calendars = { my: ['Shows & Movies', 'Shows', 'Movies'], all: ['Premieres', 'New Shows', 'Finales', 'Movies'] };

let sort = $state('Watched Date');
const historyMenu = withTraktSorts([
  { by: 'added', label: 'Watched Date' },
  { by: 'plays', label: 'Plays' },
  { by: 'title', label: 'Title' },
  { by: 'percentage', label: 'Percentage' },
  { by: 'votes', label: 'Votes' },
]);
let historySort = $state('votes');
let calendar = $state({ group: 'my', name: 'Shows & Movies' });
let movies = $state(true);
let shows = $state(true);
let reportOpen = $state(false);
let watchOpen = $state(false);
const tasteTags = [{ text: '7 services' }, { text: '3 of 5 genres' }];
// Lines break at \n, like OG's <br>.
const tips = {
  certification: 'Parents Strongly Cautioned\nAges 13+ Recommended',
  era: 'Best known for Breaking Bad',
  votes: '12,345 votes',
};
const rewatch = progressTooltip({
  progress: { aired: 20, completed: 12, plays: 12, minutesWatched: 480, minutesLeft: 320 },
  fullProgress: { aired: 20, completed: 20, plays: 32, minutesWatched: 1280, minutesLeft: 0 },
});
const library = {
  added: 'Mar 4, 2024',
  metadata: { media_type: 'bluray', resolution: 'uhd_4k', hdr: 'hdr10', audio: 'dolby_atmos', audio_channels: '7.1' },
  sources: ['plex' as const],
};
const showLibrary = { episodes: { done: 27, aired: 32 }, sources: ['plex' as const] };
const listedOn = [
  { id: 1, name: 'Sci-Fi Faves', collaboration: false },
  { id: 2, name: '2026 Rewatch', collaboration: false },
  { id: 3, name: 'Movie Night with Sam', collaboration: true },
  { id: 4, name: 'Best of the 90s', collaboration: false },
  { id: 5, name: 'Comfort Watches', collaboration: false },
  { id: 6, name: 'Mind Benders', collaboration: false },
  { id: 7, name: 'Oscar Night Picks', collaboration: false },
];
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
  <Variant label="Sort menu, Trakt's sorts in a flyout, as History, Library, Ratings, Progress and credits use">
    <div class="toolbar">
      <Dropdown joined section="Sort">
        {#snippet trigger()}<SortLabel sort={historyMenu.find(({ by }) => by === historySort)} />{/snippet}
        <SortMenu sorts={historyMenu} current={historySort} onpick={({ by }) => (historySort = by)} />
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
  note="The art dialogs: the item's fanart under glass, with the form below. Report sends to the stubbed API; Watch Now loads Fight Club's real offers, with shimmering tiles until they land.">
  <Variant label="md: Report">
    <DemoButton onclick={() => (reportOpen = true)}>Report Fight Club</DemoButton>
  </Variant>
  <Variant label="xl, click outside closes: Watch Now">
    <DemoButton onclick={() => (watchOpen = true)}>Watch Fight Club now</DemoButton>
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
  note="The block under a summary poster, at the sidebar's width. Its button opens the Watch Now dialog.">
  <Container>
    <div class="summary-sidebar">
      <WatchNow button={watchNow} title={fightClub.title} year={fightClub.year} fanart={data.fanart} />
    </div>
  </Container>
</Specimen>

<Specimen title="Toast" note="Glass toasts, top right under where the header sits. With action adds an Undo button that closes the toast and runs.">
  <div class="buttons">
    <DemoButton onclick={() => toast.success('Fight Club added to your watchlist.')}>Success</DemoButton>
    <DemoButton onclick={() => toast.error('This item was recently refreshed. Please try again later.')}>Error</DemoButton>
    <DemoButton onclick={() => toast.success('You hid Season 3 of Dexter.', {
      label: 'Undo',
      run: () => toast.success('Season 3 of Dexter is back on your progress.'),
    })}>With action</DemoButton>
  </div>
</Specimen>

<Specimen title="Tooltip" row
  note="Hover or tab to a trigger; Esc hides it and touch never opens one, except a chart's, which a click or tap toggles. Text centers and balances its lines; rows with something on their right, and the library card, align left. Its bands sit on the side away from the arrow, the header lightest. Without room on its side, off the screen or over its trigger, it flips side and mirrors them (Flipped). A chart's tooltip names its mark in the header, shows it in the header's band, then leads with the number. Only the box takes the pointer: the gap to it passes the pointer through to what's under it, and a short grace on leaving still lets you cross it. A tooltip that only repeats its trigger's name isn't linked as its description, so screen readers say it once. A summary button's tooltip spans the whole button, right under it (Favorites). A watched tooltip's play count links to your history of that title, for the pointer only, like the list tooltip's names.">
  <Variant label="Plays, a movie's quick icon, the count linked to your history">
    <Tooltip placement="bottom">
      {#snippet trigger(tooltip)}
        <DemoButton aria-label="Add to watched history" {...tooltip}><Icon svg={check} /></DemoButton>
      {/snippet}
      <PlaysTip plays={{ count: 3, minutes: 390, at: 'Oct 12, 2026' }} href="#tooltip" />
    </Tooltip>
  </Variant>
  <Variant label="Plays, an old import with no date">
    <Tooltip placement="bottom">
      {#snippet trigger(tooltip)}
        <DemoButton aria-label="Add to watched history" {...tooltip}><Icon svg={check} /></DemoButton>
      {/snippet}
      <PlaysTip plays={{ count: 1, minutes: 130 }} />
    </Tooltip>
  </Variant>
  <Variant label="Favorited, a quick icon">
    <Tooltip placement="bottom">
      {#snippet trigger(tooltip)}<DemoButton aria-label="Remove from favorites" {...tooltip}>Favorite</DemoButton>{/snippet}
      <FavoritedTip date="Sep 28, 2026" />
    </Tooltip>
  </Variant>
  <Variant label="Favorited, with a note">
    <Tooltip placement="bottom">
      {#snippet trigger(tooltip)}<DemoButton aria-label="Remove from favorites" {...tooltip}>Favorite</DemoButton>{/snippet}
      <FavoritedTip date="Sep 28, 2026" note="My go to 4K HDR demo for the home theater. The race scene is amazing!" />
    </Tooltip>
  </Variant>
  <Variant label="Header, an episode over your plays">
    <Tooltip>
      {#snippet trigger(tooltip)}<DemoButton aria-label="1x01" {...tooltip}>1x01</DemoButton>{/snippet}
      <TooltipHeader><span>1x01 <b>Pilot</b></span></TooltipHeader>
      <PlaysTip plays={{ count: 1, minutes: 58, at: 'Jan 20, 2008' }} />
    </Tooltip>
  </Variant>
  <Variant label="Text, a certification">
    <Tooltip text={tips.certification}>
      {#snippet trigger(tooltip)}<span class="start site" {...tooltip}>PG-13</span>{/snippet}
    </Tooltip>
  </Variant>
  <Variant label="Left, a career era">
    <Tooltip text={tips.era} placement="left">
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
  <Variant label="Progress, a rewatch, each count linked to your history">
    <Tooltip placement="bottom">
      {#snippet trigger(tooltip)}<a class="start" href="#tooltip" {...tooltip}>60%</a>{/snippet}
      <ProgressTip progress={rewatch} href="#tooltip" />
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
  <Variant label="Lists, a list button">
    <Tooltip placement="bottom">
      {#snippet trigger(tooltip)}<DemoButton aria-label="Manage lists" {...tooltip}>3 lists</DemoButton>{/snippet}
      <ListedTip user="sean" watchlisted lists={listedOn.slice(0, 2)} />
    </Tooltip>
  </Variant>
  <Variant label="Lists, more than six">
    <Tooltip placement="bottom">
      {#snippet trigger(tooltip)}<DemoButton aria-label="Manage lists" {...tooltip}>8 lists</DemoButton>{/snippet}
      <ListedTip user="sean" watchlisted lists={listedOn} />
    </Tooltip>
  </Variant>
  <Variant label="Chart, a season of the progress bar">
    <Tooltip toggles>
      {#snippet trigger(tooltip)}<a class="bar" href="#tooltip" aria-label="Season 18" {...tooltip}></a>{/snippet}
      <ChartTip name="Season 18" tag={{ text: 'Up next 18x02', kind: 'primary' }} value="17%" words="watched"
        detail="1 / 6 eps — 1 play (49m)">
        {#snippet band()}
          <TooltipBar percent={17} />
          <span class="tip-left"><Stat svg={hourglass} value="3h 40m" noun="left" aside="(5 eps)" /></span>
        {/snippet}
      </ChartTip>
    </Tooltip>
  </Variant>
  <Variant label="Flipped, a chart tooltip turned below its mark">
    <span class="flipped-demo">
      <TooltipBox side="bottom" flipped>
        <ChartTip name="Season 15" tag={{ text: 'Complete', icon: completeCheck, tint: 'var(--color-progress-tip-watched)' }}
          value="100%" words="watched" detail="22 / 22 eps — last watched May 13, 2024">
          {#snippet band()}<TooltipBar percent={100} />{/snippet}
        </ChartTip>
      </TooltipBox>
    </span>
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

/* The progress row's time-left stat under a season tooltip's bar, at the tooltip's size and dark like it. */
.tip-left {
  --font-size-stat-noun: var(--font-size-small);
  --font-size-stat-number: var(--font-size-small);
  --font-size-stat-icon: var(--font-size-small);
  color-scheme: dark;
  display: flex;
  justify-content: center;
}

.flipped-demo {
  display: block;
  padding-block-start: var(--tooltip-arrow);
}

.bar {
  display: block;
  inline-size: var(--gutter);
  block-size: calc(var(--gutter) * 3);
  background-color: var(--brand-primary);
}
</style>
