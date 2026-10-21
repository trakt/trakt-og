<!--
  The weekend box office (`/movies/boxoffice`) in a SidebarFrame, like the charts: the chart picker and the list's
  description, This Weekend (the top 10's total, #1's share, the openers and a strip of each film's share) and the
  films opening on Friday in the sidebar. The content is the chart as a table: rank, poster, title with its pills,
  its run, the weekend gross against #1's, its share, and the list row's quick icons with the rating (no favorite, as
  in OG).
-->
<script lang="ts">
import ChartPicker from '$lib/charts/ChartPicker.svelte';
import TagPills from '$lib/components/labels/TagPills.svelte';
import QuickIcons from '$lib/components/media/QuickIcons.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import RailGroup from '$lib/components/sidebar/RailGroup.svelte';
import SidebarFrame from '$lib/components/sidebar/SidebarFrame.svelte';
import SidebarSection from '$lib/components/sidebar/SidebarSection.svelte';
import SidebarTitle from '$lib/components/sidebar/SidebarTitle.svelte';
import type { HeaderUser } from '$lib/components/header/HeaderUser';
import { overlay } from '$lib/overlay/overlay';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import type { loadBoxOffice } from './loadBoxOffice.ts';
import type { WeekInRelease } from './weekInRelease.ts';

type Props = {
  data: Awaited<ReturnType<typeof loadBoxOffice>> & { user: HeaderUser | null; datePreferences: DatePreferences };
};

const { data }: Props = $props();

const top = $derived(data.rows.at(0)?.revenue ?? 0);
const share = (revenue: number) => (data.total ? revenue / data.total : 0);
const percent = (fraction: number) => `${(fraction * 100).toFixed(1)}%`;
const dollars = (amount: number) => `$${amount.toLocaleString('en-US')}`;
const millions = (amount: number) => `$${(amount / 1_000_000).toFixed(1)}M`;
const openers = $derived(data.rows.filter((row) => row.run?.kind === 'opening').length);
const runPill = (run: WeekInRelease) => ({
  text: run.label,
  kind: run.kind === 'opening' ? ('primary' as const) : run.kind === 'week' ? ('light' as const) : undefined,
});
</script>

<svelte:head>
  <title>Weekend Box Office - Trakt</title>
  <meta name="description" content={data.description} />
</svelte:head>

<!-- Film links point at OG routes, and the share strip at rows on this page; resolve() has nothing to add. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<SidebarFrame label="Box Office" collapsed={data.sidebar.collapsed}>
  {#snippet sidebar()}
    <SidebarTitle>
      {#snippet heading()}
        <ChartPicker type="movies" chart="boxoffice" period={data.period} signedIn={data.user !== null} />
      {/snippet}
    </SidebarTitle>
    {#if data.description}<p class="subtitle">{data.description}</p>{/if}

    <SidebarSection id="weekend" title="This Weekend" open={data.sidebar.weekend} remember>
      <dl class="kpis">
        <div><dt>Top 10</dt><dd>{millions(data.total)}</dd></div>
        <div><dt>#1's share</dt><dd>{percent(share(top)).replace('.0%', '%')}</dd></div>
        <div><dt>Openers</dt><dd>{openers}</dd></div>
      </dl>
      <ul class="share" aria-label="Each film's share of the weekend">
        {#each data.rows as row, i (row.id)}
          <li style:flex-grow={row.revenue}>
            <a href="#box-office-{i + 1}" style:background-image={row.poster ? `url('${row.poster}')` : undefined}
              title="{row.title}: {percent(share(row.revenue))}"
              aria-label="#{i + 1} {row.title}, {percent(share(row.revenue))}"
            ><span aria-hidden="true">{share(row.revenue) >= 0.05 ? i + 1 : ''}</span></a>
          </li>
        {/each}
      </ul>
    </SidebarSection>

    {#if data.opening.films.length > 0}
      <SidebarSection id="opening" title="Opening Friday {data.opening.friday}" open={data.sidebar.opening} remember>
        <ul class="opening">
          {#each data.opening.films as film (film.id)}
            <li>
              <a href={film.href}>
                <span class="poster">{#if film.poster}<img src={film.poster} alt="" loading="lazy" />{/if}</span>
                <span class="film">
                  <span class="title">{film.title}</span>
                  <TagPills tags={film.tags} />
                </span>
              </a>
            </li>
          {/each}
        </ul>
      </SidebarSection>
    {/if}
  {/snippet}

  {#snippet rail()}
    <RailGroup>
      <a class="rail-total" href="#box-office-1" title="The top 10's weekend gross">
        <small>Top 10</small><b>{millions(data.total).replace('.0M', 'M')}</b>
      </a>
    </RailGroup>
  {/snippet}

  <div class="box-office">
    <header class="mast">
      <p class="eyebrow">Weekend box office</p>
      <h2>{data.weekend.label}</h2>
    </header>

    <table>
      <thead>
        <tr>
          <th scope="col" class="rank">#</th>
          <td></td>
          <th scope="col">Film</th>
          <th scope="col">Run</th>
          <th scope="col" class="number">Weekend gross</th>
          <th scope="col" class="number">Share</th>
          <th scope="col"><span class="visually-hidden">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        {#each data.rows as row, i (row.id)}
          {@const state = overlay.state('movie', row.id)}
          <tr id="box-office-{i + 1}" class={{ top: i < 3 }}>
            <td class="rank">{i + 1}</td>
            <td class="poster">
              <a href={row.href} tabindex="-1" aria-hidden="true">
                {#if row.poster}<img src={row.poster} alt="" loading="lazy" />{/if}
              </a>
            </td>
            <td class="film">
              <a href={row.href} class="title">{row.title}{#if row.year}<span class="year">{row.year}</span>{/if}</a>
              <TagPills tags={row.tags} />
            </td>
            <td class="run"><span class="line">{#if row.run}<TagPills tags={[runPill(row.run)]} />{/if}</span></td>
            <td class="number gross">
              <b class="line">{dollars(row.revenue)}</b>
              <span class="bar" style:--share="{top ? (row.revenue / top) * 100 : 0}%"></span>
            </td>
            <td class="number share-cell"><span class="line">{percent(share(row.revenue))}</span></td>
            <td class="actions">
              <QuickIcons row small fill={quickIconFill({ state, datePreferences: data.datePreferences })}
                released favorite={false} rating={row.rating}
                ratingTarget={{ type: 'movie', id: row.id, title: row.title }}
                watchTarget={{ type: 'movie', id: row.id, title: row.title, runtime: row.runtime }} />
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

  </div>
</SidebarFrame>

<style>
/* The collapsed rail's figure: the top 10's weekend gross, like the calendar's today. */
.rail-total {
  display: grid;
  justify-items: center;
  inline-size: var(--rail-today-width);
  padding: var(--rail-total-padding);
  border-radius: var(--radius-control);
  background-color: var(--color-mini-month-cell);
  color: var(--color-frame-ink);
  line-height: 1.05;
  text-decoration: none;

  & small {
    color: var(--brand-primary);
    font-size: var(--font-size-mini-month-weekday);
    font-weight: var(--font-weight-headings-heavy);
    letter-spacing: var(--letter-spacing-sidebar-label);
    text-transform: uppercase;
  }

  & b {
    font-family: var(--font-box-office-figures);
    font-stretch: condensed;
    font-size: var(--font-size-box-office-rail-total);
  }

  &:is(:hover, :focus-visible) {
    background-color: var(--color-control-hover-bg);
  }
}

.subtitle {
  margin: 0;
  color: var(--color-sidebar-note);
  font-size: var(--font-size-control);
}

/* This Weekend: three figures over a strip of each film's share, its poster under a red wash. */
.kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 0;
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);

  /* Trimmed to the figure's cap height and the label's baseline, so the pair sits centred in its box. */
  & div {
    display: grid;
    gap: var(--box-office-kpi-gap);
    padding: var(--box-office-kpi-padding);
  }

  & div + div {
    border-inline-start: 1px solid var(--color-control-border);
  }

  & dt {
    order: 1;
    text-box: trim-both cap alphabetic;
    color: var(--color-sidebar-label);
    font-size: var(--font-size-sidebar-section);
    letter-spacing: var(--letter-spacing-sidebar-label);
    text-transform: uppercase;
  }

  & dd {
    margin: 0;
    font-family: var(--font-box-office-figures);
    font-stretch: condensed;
    font-size: var(--font-size-box-office-kpi);
    line-height: 1;
    font-weight: var(--font-weight-headings-heavy);
    font-variant-numeric: tabular-nums;
    text-box: trim-both cap alphabetic;
  }
}

.share {
  display: flex;
  gap: 2px;
  block-size: var(--box-office-share-height);
  margin: 0;
  padding: 0;
  border-radius: var(--radius-control);
  overflow: hidden;
  list-style: none;

  & li {
    display: grid;
    flex-basis: 0;
    min-inline-size: 0;
  }

  & a {
    position: relative;
    display: grid;
    place-items: center;
    background-color: var(--color-control-bg);
    background-position: center 20%;
    background-size: cover;
    color: var(--color-frame-text);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-headings-heavy);
    text-decoration: none;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-color: var(--color-box-office-share-wash);
    }

    &:is(:hover, :focus-visible)::before {
      background-color: transparent;
    }

    /* Trimmed to the digits' cap height, so each rank sits on the tile's centre line. */
    & span {
      position: relative;
      text-box: trim-both cap alphabetic;
    }
  }
}

/* Opening Friday: a poster beside the title and the film's pills. */
.opening {
  display: grid;
  gap: var(--box-office-opening-gap);
  margin: 0 calc(-1 * var(--space-sm-inline));
  padding: 0;
  list-style: none;

  & a {
    display: grid;
    grid-template-columns: var(--box-office-opening-poster-width) minmax(0, 1fr);
    gap: var(--space-base-inline);
    align-items: center;
    padding: var(--space-sm-block) var(--space-sm-inline);
    border-radius: var(--radius-control);
    color: var(--color-frame-ink);
    text-decoration: none;

    &:is(:hover, :focus-visible) {
      background-color: var(--color-control-hover-bg);
    }
  }

  & .poster {
    display: block;
    aspect-ratio: 2 / 3;
    border-radius: var(--radius-control);
    overflow: hidden;
    background-color: var(--color-control-bg);

    & img {
      display: block;
      inline-size: 100%;
      block-size: auto;
      aspect-ratio: 2 / 3;
      object-fit: cover;
    }
  }

  & .film {
    display: grid;
    gap: var(--box-office-opening-title-gap);
    min-inline-size: 0;
  }

  & .title {
    overflow: hidden;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-headings);
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* The chart. */
.box-office {
  display: grid;
  gap: var(--box-office-gap);
  padding: var(--box-office-padding);
  color: var(--color-frame-ink);
}

.mast {
  display: grid;
  gap: var(--box-office-mast-gap);

  & .eyebrow {
    margin: 0;
    color: var(--brand-primary);
    font-size: var(--font-size-box-office-eyebrow);
    font-weight: var(--font-weight-headings-heavy);
    letter-spacing: var(--letter-spacing-sidebar-label);
    text-transform: uppercase;
  }

  & h2 {
    margin: 0;
    font-family: var(--font-box-office-figures);
    font-stretch: condensed;
    font-size: var(--font-size-box-office-heading);
    font-weight: var(--font-weight-headings-heavy);
    line-height: 0.95;
    text-transform: uppercase;
  }
}

table {
  inline-size: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

thead :is(th, td) {
  padding: var(--box-office-cell-padding);
  border-block-end: 1px solid var(--color-control-border);
  color: var(--color-sidebar-label);
  font-size: var(--font-size-sidebar-section);
  font-weight: var(--font-weight-menu-header);
  letter-spacing: var(--letter-spacing-sidebar-label);
  text-align: start;
  text-transform: uppercase;
}

/* The film's details and figures line up along the top, each first line as tall as the quick-icon bar so the title,
   the pills, the figures and the icons share one centre line; the rank and poster stay centred. */
td {
  padding: var(--box-office-row-padding) var(--box-office-cell-padding);
  border-block-end: 1px solid var(--color-frame-line);
  vertical-align: top;

  &:is(.rank, .poster) {
    vertical-align: middle;
  }
}

.line {
  display: flex;
  align-items: center;
  block-size: var(--box-office-line);

  .number & {
    justify-content: flex-end;
  }
}

tbody tr {
  /* Clear of the fixed header when the share strip jumps to it. */
  scroll-margin-block-start: calc(var(--header-height) + var(--box-office-gap));

  &:hover {
    background-color: var(--color-box-office-row-hover);
  }

  /* The film picked in the sidebar's share strip. */
  &:target {
    background-color: var(--color-box-office-row-target);
  }
}

.number {
  text-align: end;
}

td.rank {
  inline-size: var(--box-office-rank-width);
  color: var(--color-box-office-rank-muted);
  font-family: var(--font-box-office-figures);
  font-stretch: condensed;
  font-size: var(--font-size-box-office-rank);
  line-height: 1;
  font-weight: var(--font-weight-headings-heavy);
  text-align: center;
  /* Trimmed to the digits, so the rank sits on the poster's centre line. */
  text-box: trim-both cap alphabetic;

  .top & {
    color: var(--color-frame-ink);
  }
}

th.rank {
  text-align: center;
}

/* The image takes its own size: a percentage height inside a table cell resolves against the row in some browsers,
   which zoomed and cropped the poster. */
td.poster {
  /* As narrow as its poster, so the title sits close beside it. */
  inline-size: 1%;
  padding-inline-end: var(--box-office-poster-gap);

  & a {
    display: block;
    inline-size: var(--box-office-poster-width);
  }

  & img {
    display: block;
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: 2 / 3;
    border-radius: var(--radius-control);
    background-color: var(--color-control-bg);
    object-fit: cover;
  }
}

td.film {
  & .title {
    display: flex;
    align-items: center;
    block-size: var(--box-office-line);
    color: var(--color-frame-ink);
    font-size: var(--font-size-large);
    font-weight: var(--font-weight-headings);
    text-decoration: none;

    &:is(:hover, :focus-visible) {
      color: var(--brand-primary);
    }
  }

  /* Like the cards' year: smaller and lighter after the title. */
  & .year {
    margin-inline-start: 0.25em;
    color: var(--color-sidebar-label);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-headings-light);
  }
}

.gross {
  & b {
    font-size: var(--font-size-box-office-gross);
    font-weight: var(--font-weight-headings-heavy);
  }

  & .bar {
    display: block;
    block-size: var(--box-office-bar-height);
    margin-block-start: var(--space-xs-inline);
    border-radius: var(--box-office-bar-height);
    background: linear-gradient(to left, var(--brand-primary) var(--share), var(--color-box-office-bar-track) 0);
  }
}

.share-cell {
  color: var(--color-sidebar-pill-text);
  font-size: var(--font-size-box-office-share);
}

td.actions {
  inline-size: 1%;
  padding-inline-start: var(--box-office-actions-gap);
  white-space: nowrap;
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
