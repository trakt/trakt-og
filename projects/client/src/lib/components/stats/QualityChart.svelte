<!--
  The stats page's Quality Over Time chart: a line chart of ratings in percent over a show's seasons or a season's
  episodes. Trakt's votes are the red line, faintly shaded under. You, IMDb and TMDB can join it, each a
  chip over the chart that switches its line on and off, with its value labelled at the line's right end. The Scale
  dropdown starts Zoomed (or on the scale this browser last picked), from the nearest 10 under the lowest value with a level every 10, or runs 0 to 100%, every 25.
  A dashed line marks the season's own rating, labelled at the right with the lines. Each season or episode is a column of full height that links to its
  stats page, shows a faint guide and a tooltip on hover or focus (a row and bar per site, the viewer's own rating
  centered in its footer as OG's heart line), and is named by its values for screen readers; a rating under the vote minimum is a gap in
  the line. Too narrow for its columns, the plot scrolls sideways under its fixed percents and end labels. Lines are one SVG stretched over the plot, dots
  plain elements, so strokes stay 2px and crisp. `you`, `imdb` and `tmdb` are a percent per point, in order; `sites`
  offers the IMDb and TMDB chips, off until picked, and `onsites` fires when one is first switched on, for the caller
  to load them while `loading`.
    <QualityChart {data} you={you} sites onsites={load} loading={loading} imdb={imdb} tmdb={tmdb} />
-->
<script lang="ts">
import RatingLine from '#lib/components/rating/RatingLine.svelte';
import traktLogo from '#lib/assets/sites/trakt.png';
import { externalRatingLogos } from '#lib/components/summary/externalRatingLogos.ts';
import ChartTip from '#lib/components/tooltip/ChartTip.svelte';
import TooltipBar from '#lib/components/tooltip/TooltipBar.svelte';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import Dropdown from '#lib/components/dropdown/Dropdown.svelte';
import ToggleChips from '#lib/components/toggle-chips/ToggleChips.svelte';
import type { QualityData } from '#lib/stats/QualityData.ts';
import { nudgeLabels } from './nudgeLabels.ts';
import { qualityPath } from './qualityPath.ts';
import { qualityScale } from './qualityScale.ts';
import { type QualityScaleChoice, qualityScaleChoice } from './qualityScaleChoice.ts';
import type { SiteLine } from './SiteLine.ts';
import { countLabel } from '#lib/utils/countLabel.ts';
import { onMount, untrack } from 'svelte';

type Values = readonly (number | null)[];

interface Props {
  data: QualityData;
  you?: Values;
  imdb?: SiteLine;
  tmdb?: SiteLine;
  /** Offers the IMDb and TMDB chips, switched off until picked. */
  sites?: boolean;
  /** The sites' ratings are loading: their chips are busy. */
  loading?: boolean;
  /** Called when an IMDb or TMDB chip is first switched on. */
  onsites?: () => void;
}

const { data, you, imdb, tmdb, sites = false, loading = false, onsites }: Props = $props();

/** Each site's logo in the tooltip, as Second Opinions shows them. */
const logos: Readonly<Record<string, string>> = {
  community: traktLogo,
  imdb: externalRatingLogos.imdb,
  tmdb: externalRatingLogos.tmdb,
};

const SERIES = [
  { id: 'community', name: 'Trakt' },
  { id: 'you', name: 'You' },
  { id: 'imdb', name: 'IMDb' },
  { id: 'tmdb', name: 'TMDB' },
] as const;

/** The closest two end labels sit, in percent of the plot: a little over a label's height at its token height. */
const LABEL_GAP = 7;

const scales = [
  { id: 'zoom', label: 'Zoomed' },
  { id: 'full', label: '0 to 100%' },
] as const;

let selected = $state<readonly string[]>(['community', 'you']);
let scale = $state<QualityScaleChoice>('zoom');

// The server draws it zoomed; the browser then takes the scale it last picked, so hydration matches.
onMount(() => {
  scale = qualityScaleChoice.read();
});

const pickScale = (choice: QualityScaleChoice) => {
  scale = choice;
  qualityScaleChoice.write(choice);
};

const values = $derived({
  community: data.points.map(({ percent }) => percent),
  you,
  imdb: imdb?.percents,
  tmdb: tmdb?.percents,
});
const votes = $derived<Partial<Record<string, readonly (number | null)[]>>>({
  community: data.points.map((point) => point.votes),
  imdb: imdb?.votes,
  tmdb: tmdb?.votes,
});
const offered = $derived(
  SERIES.filter(({ id }) => {
    if (id === 'community') return true;
    return id === 'you' ? Boolean(you) : sites;
  }),
);
const visible = $derived(
  offered.flatMap((series) => {
    const line = values[series.id];
    return selected.includes(series.id) && line ? [{ ...series, line }] : [];
  }),
);
const chips = $derived(
  offered.map(({ id, name }) => ({
    id,
    label: name,
    swatch: `var(--color-quality-${id})`,
    busy: loading && (id === 'imdb' || id === 'tmdb') && selected.includes(id),
  })),
);
const drawn = $derived([
  ...visible.flatMap(({ line }) => line.flatMap((value) => (value === null ? [] : [value]))),
  ...(data.reference ? [data.reference.percent] : []),
]);
const layout = $derived(qualityScale({ values: drawn, zoom: scale === 'zoom' }));
const area = $derived.by(() => {
  const community = visible.find(({ id }) => id === 'community');
  return community && qualityPath({ values: community.line, at: layout.at, area: true });
});
const paths = $derived(visible.map(({ id, line }) => ({ id, d: qualityPath({ values: line, at: layout.at }) })));
const ends = $derived.by(() => {
  const lines = visible.flatMap(({ id, name, line }) => {
    const value = line.findLast((entry) => entry !== null);
    return value == null ? [] : [{ id: id as string, name: name as string, value }];
  });
  const reference = data.reference && { id: 'reference', name: data.reference.label, value: data.reference.percent };
  const last = reference ? [...lines, reference] : lines;
  const text = new Map<string, string>(last.map(({ id, name, value }) => [id, `${value}% ${name}`]));
  const spread = nudgeLabels({ labels: last.map(({ id, value }) => ({ id, at: layout.at(value) })), gap: LABEL_GAP });
  return spread.map(({ id, at }) => ({ id, at, text: text.get(id) ?? '' }));
});

$effect(() => {
  if (sites && (selected.includes('imdb') || selected.includes('tmdb'))) untrack(() => onsites?.());
});

/** The viewer's own rating at a point, back on its 1 to 10 scale, while the You line shows. */
const rated = (index: number) => {
  const value = visible.find(({ id }) => id === 'you')?.line.at(index);
  return value == null ? undefined : Math.round(value / 10);
};

/** A tooltip row per visible site: its percent and votes; Trakt's stays with a null percent when it has too few. */
const rows = (index: number) =>
  visible.flatMap(({ id, name, line }) => {
    const percent = line.at(index) ?? null;
    if (id === 'you' || (percent === null && id !== 'community')) return [];
    const count = votes[id]?.at(index) ?? null;
    return [{ id, name, percent, votes: count === null ? undefined : countLabel(count, 'vote') }];
  });

/** The highest visible point in a column, which its tooltip sits over. */
const top = (index: number) => {
  const shown = visible.flatMap(({ line }) => line.at(index) ?? []);
  return shown.length > 0 ? Math.max(...shown) : undefined;
};

const uid = $props.id();

const name = (index: number) => {
  const point = data.points.at(index);
  if (!point) return '';
  const rating = rated(index);
  const sites = rows(index).map(({ name: site, percent, votes: count }) => {
    const score = percent === null ? `${site}: too few votes` : `${percent}% ${site}`;
    return count ? `${score} (${count})` : score;
  });
  return [[point.name, point.title].filter(Boolean).join(' '), ...sites, ...(rating === undefined ? [] : [`You rated ${rating}`])].join(', ');
};
</script>

<!-- Each column leads to its season's or episode's stats page, a route resolve() can't take a built path for. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<div class="quality">
  <div class="controls">
    <ToggleChips label="Lines" multiple options={chips} bind:selected />
    <Dropdown section="Scale">
      {#snippet trigger()}{scales.find(({ id }) => id === scale)?.label}&nbsp;{/snippet}
      <ul>
        {#each scales as option (option.id)}
          <li>
            <button type="button" aria-current={option.id === scale ? 'true' : undefined} onclick={() => pickScale(option.id)}>
              {option.label}
            </button>
          </li>
        {/each}
      </ul>
    </Dropdown>
  </div>

  <div class="frame" style:--count={data.points.length}>
      <div class="gutter" aria-hidden="true">
        {#each layout.levels as level (level)}
          <span class="percent" style:inset-block-end="{layout.at(level)}%">{level}%</span>
        {/each}
      </div>

      <div class="scroll">
      <div class="plot">
        {#each layout.levels.slice(1) as level (level)}
          <span class="level" style:inset-block-end="{layout.at(level)}%" aria-hidden="true"></span>
        {/each}
        {#if data.reference}
          <span class="level reference" style:inset-block-end="{layout.at(data.reference.percent)}%" aria-hidden="true"></span>
        {/if}

        <svg class="lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {#if area}<path class="area" d={area} />{/if}
          {#each paths as { id, d } (id)}
            <path {d} style:--series="var(--color-quality-{id})" />
          {/each}
        </svg>

        <ol class="columns" aria-label="Rating by {data.unit}">
          {#each data.points as point, i (point.traktId)}
            {@const rating = rated(i)}
            {@const peak = top(i)}
            {@const pointAnchor = peak === undefined ? undefined : `--quality-${uid}-${i}`}
            <li class="column">
              {#snippet yours()}<span class="yours"><RatingLine rating={rating ?? 0} /></span>{/snippet}
              {#if peak !== undefined}
                <span class="anchor" style:anchor-name={pointAnchor} style:inset-block-end="{layout.at(peak)}%"></span>
              {/if}
              <Tooltip toggles at={pointAnchor}>
                <span class="tip">
                <ChartTip name={point.name} subtitle={point.title} footer={rating === undefined ? undefined : yours}>
                  {#snippet detail()}
                    <span class="sites">
                      {#each rows(i) as row (row.id)}
                        <span class="site" style:--series="var(--color-quality-{row.id})">
                          <span class="site-name"
                            ><span class="site-logo"><img src={logos[row.id]} alt="" /></span><span
                              >{row.name} {#if row.votes}<span class="site-votes">{row.votes}</span>{/if}</span
                            ></span>
                          <span class="site-score">{row.percent === null ? 'Too few' : `${row.percent}%`}</span>
                          <span class="site-bar"><TooltipBar percent={row.percent ?? 0} color="var(--series)" /></span>
                        </span>
                      {/each}
                    </span>
                  {/snippet}
                </ChartTip>
                </span>
                {#snippet trigger(tooltip)}
                  <a class="hit" href={point.href} aria-label={name(i)} {...tooltip}></a>
                {/snippet}
              </Tooltip>
              {#each visible as { id, line } (id)}
                {@const value = line[i]}
                {#if value != null}
                  <span class="dot" style:--series="var(--color-quality-{id})" style:inset-block-end="{layout.at(value)}%"
                  ></span>
                {/if}
              {/each}
              <span class="axis" aria-hidden="true">{point.axis}</span>
            </li>
          {/each}
        </ol>
      </div>
      </div>

      <div class="ends" aria-hidden="true">
        {#each ends as end (end.id)}
          <span class="end" style:--series="var(--color-quality-{end.id})" style:inset-block-end="{end.at}%">{end.text}</span>
        {/each}
      </div>
    </div>
</div>

<style>
.quality {
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-dropdown-row);
  margin-block-end: var(--space-quality-controls);
}

/* The percents and the end labels stay put; only the plot scrolls, once its columns run out of room. */
.frame {
  /* Room over the plot for a dot or label at 100%, and under it for the axis. */
  --over: var(--quality-dot-size);
  --under: calc(var(--space-quality-axis) + var(--font-size-quality-label));
  display: grid;
  grid-template-columns: var(--quality-gutter) minmax(0, 1fr) var(--quality-labels);
}

.scroll {
  padding-block: var(--over) var(--under);
  overflow: auto hidden;
}

.gutter,
.ends {
  margin-block: var(--over) var(--under);
}

.gutter,
.plot,
.ends {
  position: relative;
  block-size: var(--quality-plot-height);
}

.plot {
  min-inline-size: calc(var(--count) * var(--quality-column-min));
}

.percent,
.end {
  position: absolute;
  translate: 0 50%;
  font-size: var(--font-size-quality-label);
  line-height: 1;
  white-space: nowrap;
}

.percent {
  inset-inline-end: 0;
  padding: var(--space-quality-label);
  color: var(--color-chart-axis-label);
}

.plot {
  border-block-end: 1px solid var(--color-chart-axis);
}

.level {
  position: absolute;
  inset-inline: 0;
  border-block-start: 1px dashed var(--color-quality-grid);
  pointer-events: none;

  &.reference {
    z-index: 1;
    border-color: var(--color-quality-reference);
  }
}


.lines {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  overflow: visible;
  pointer-events: none;

  path {
    fill: none;
    stroke: var(--series);
    stroke-width: var(--quality-line-width);
    stroke-linejoin: round;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }

  .area {
    fill: var(--color-quality-area);
    stroke: none;
  }
}

.columns {
  position: absolute;
  inset: 0;
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}

.column {
  position: relative;
  flex: 1;
  min-inline-size: 0;
}

.hit {
  position: absolute;
  inset: 0;
  display: block;

  /* The guide down the column under the pointer. */
  &::before {
    content: '';
    position: absolute;
    inset-block: 0;
    inset-inline-start: 50%;
    inline-size: 1px;
    background-color: var(--color-quality-guide);
    opacity: 0;
  }

  &:is(:hover, :focus-visible)::before {
    opacity: 1;
  }
}

/* Where the column's tooltip points: its highest dot. */
.anchor {
  position: absolute;
  inset-inline-start: 50%;
  translate: -50% 50%;
  inline-size: var(--quality-dot-size);
  block-size: var(--quality-dot-size);
  pointer-events: none;
}

.dot {
  position: absolute;
  inset-inline-start: 50%;
  translate: -50% 50%;
  inline-size: var(--quality-dot-size);
  block-size: var(--quality-dot-size);
  border-radius: 50%;
  background-color: var(--series);
  box-shadow: 0 0 0 var(--quality-dot-ring) var(--color-surface);
  pointer-events: none;

  /* The rest dim while one column is picked out, like the minutes chart's bars. */
  .columns:has(.hit:is(:hover, :focus-visible)) .column:not(:has(.hit:is(:hover, :focus-visible))) & {
    opacity: var(--opacity-genre-piece-dimmed);
  }
}

.axis {
  position: absolute;
  inset-block-start: calc(100% + var(--space-quality-axis));
  inset-inline: 0;
  color: var(--color-chart-axis-label);
  font-size: var(--font-size-quality-label);
  font-weight: normal;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
}

.end {
  inset-inline-start: 0;
  padding: var(--space-quality-label);
  color: var(--series);
}

/* One width for every tooltip, so a long episode title wraps, balanced, instead of stretching it. */
.tip {
  display: block;
  inline-size: var(--quality-tip-width);
}

.sites {
  display: grid;
  gap: var(--space-quality-tip-rows);
  padding-block-end: var(--space-quality-tip-end);
}

/* A site: its logo, its name and votes, and its score, over its bar in its line's color. */
.site {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-quality-tip-bar) var(--space-quality-tip-cell);
  color: var(--color-tooltip-text);
  text-align: start;
}

.site-name {
  display: flex;
  font-weight: var(--font-weight-headings-heavy);
  align-items: center;
  gap: var(--space-quality-tip-logo);
}

/* Every logo in the same width, IMDb's wide badge too, so the names line up. */
.site-logo {
  display: inline-flex;
  flex: none;
  justify-content: center;
  inline-size: var(--quality-tip-logo);

  img {
    inline-size: 100%;
    block-size: var(--quality-tip-logo);
    object-fit: contain;
  }
}

.site-votes {
  color: var(--color-tooltip-muted);
  font-size: var(--font-size-quality-label);
  font-weight: normal;
}

.site-score {
  font-weight: var(--font-weight-headings-heavy);
}

.site-bar {
  grid-column: 1 / -1;
}

/* The footer's own padding is room enough: this takes back the rating line's space over it under a poster. */
.yours {
  display: block;
  margin-block-start: calc(-1 * var(--space-card-rating-top));
}

@media (prefers-reduced-motion: no-preference) {
  .hit::before,
  .dot {
    transition: opacity var(--transition-chart);
  }
}
</style>
