<!--
  The stats page's Second Opinions: Trakt, then each other site's rating as it gives it and as a bar on one 100 point
  scale in the site's own color, with a dashed line down the bars at Trakt's score and a badge for how far the site
  sits from it, green above and red below. Each site is a box that links out to its page. The rows share one grid, so
  the columns line up and the line runs unbroken across the gaps between them.
-->
<script lang="ts">
import traktLogo from '$lib/assets/sites/trakt.png';
import { externalRatingLogos } from '$lib/components/summary/externalRatingLogos';
import { countLabel } from '$lib/utils/countLabel';
import type { toSiteScores } from './toSiteScores.ts';

interface Props {
  trakt: { readonly percent: number; readonly votes: number };
  sites: ReturnType<typeof toSiteScores>;
}

const { trakt, sites }: Props = $props();
</script>

<!-- Every site link goes out to another site. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet bar(score: number)}
  <span class="track" aria-hidden="true"><span class="fill" style:--score={score}></span></span>
{/snippet}

<div class="scroll">
  <ol class="scores" style:--trakt={trakt.percent} aria-label="Scores out of 100">
    <li style:grid-row="1">
      <div class="row" style:--brand="var(--color-site-trakt)">
        <span class="site">
          <span class="logo-cell"><img class="logo" src={traktLogo} alt="" /></span>
          <span><span class="name">Trakt</span><span class="detail">{countLabel(trakt.votes, 'vote')}</span></span>
        </span>
        <span class="score">{trakt.percent}%</span>
        {@render bar(trakt.percent)}
      </div>
    </li>
    {#each sites as site, i (site.logo)}
      <li style:grid-row={i + 2}>
        <a class={['row', site.metascore]} href={site.href} target="_blank" rel="noopener"
          style:--brand="var(--color-site-{site.brand})">
          <span class="site">
            <span class="logo-cell"><img class={['logo', site.logo]} src={externalRatingLogos[site.logo]} alt="" /></span>
            <span><span class="name">{site.title}</span><span class="detail">{site.detail}</span></span>
          </span>
          <span class="score">{site.rating}</span>
          {@render bar(site.score)}
          <span class={['badge', site.diff.trend]}><span aria-hidden="true">{site.diff.text}</span><span
              class="visually-hidden">{site.diff.label}</span></span>
        </a>
      </li>
    {/each}
    <li class="trakt-line" style:grid-row="1 / span {sites.length + 1}" aria-hidden="true"></li>
  </ol>
</div>

<style>
.scroll {
  overflow-x: auto;
}

/* One grid for every row: zero-width edge columns let the column gap pad each box. */
.scores {
  display: grid;
  grid-template-columns:
    [edge-start] 0 [site] auto [score] auto [bar] minmax(var(--stats-site-bar-min), 1fr)
    [diff] auto [edge-end] 0;
  gap: var(--space-stats-site-rows) var(--space-stats-site-cell);
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
}

.row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: center;
  padding-block: var(--space-stats-site-cell);
  background-color: var(--color-stats-tile-bg);
  color: var(--color-text);
  text-decoration: none;
  white-space: nowrap;
  transition: background-color var(--transition-card);

  &:is(a):is(:hover, :focus-visible) {
    background-color: var(--color-stats-tile-hover);
    color: var(--color-text);
    text-decoration: none;

    & .track {
      background-color: var(--color-stats-site-track-hover);
    }
  }
}

.site {
  display: flex;
  grid-column: site;
  align-items: center;
  gap: var(--space-stats-site-cell);
}

.logo-cell {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  box-sizing: content-box;
  inline-size: var(--stats-site-logo);
  padding-inline: var(--space-stats-site-logo);
}

.logo {
  inline-size: var(--stats-site-logo);
  block-size: var(--stats-site-logo);
  object-fit: contain;

  &.imdb {
    block-size: auto;
  }

  &.metacritic {
    border: var(--strip-metascore-ring) solid var(--metascore, var(--color-metascore-none));
    border-radius: 50%;
  }
}

.name,
.detail {
  display: block;
}

.name {
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
}

.detail {
  color: var(--color-genre-count);
  font-size: var(--font-size-genre-key-count);
}

/* The site's rating as a neutral tag. */
.score {
  grid-column: score;
  justify-self: end;
  min-inline-size: var(--stats-score-tag-min);
  margin-inline-start: var(--space-stats-site-score);
  padding: var(--space-stats-score-tag);
  border-radius: var(--radius-stats-diff);
  background-color: var(--color-stats-score-tag);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.track {
  display: block;
  grid-column: bar;
  margin-inline: var(--space-stats-site-bar);
  block-size: var(--stats-site-bar-height);
  overflow: hidden;
  border-radius: var(--radius-stats-site-bar);
  background-color: var(--color-stats-site-track);
  transition: background-color var(--transition-card);
}

.fill {
  display: block;
  inline-size: calc(var(--score) * 1%);
  block-size: 100%;
  border-radius: var(--radius-stats-site-bar);
  background-color: var(--brand);
}

/* Trakt's score, dashed down the bar column across every box and the gaps between them. */
.trakt-line {
  position: relative;
  z-index: 1;
  display: block;
  grid-column: bar;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    inset-block: 0;
    /* Along the bar, inside its margins. */
    inset-inline-start: calc(
      var(--space-stats-site-bar) + (100% - 2 * var(--space-stats-site-bar)) * var(--trakt) / 100
    );
    border-inline-start: var(--stats-trakt-line) dashed var(--color-stats-trakt-line);
  }
}

.badge {
  grid-column: diff;
  margin-inline-end: var(--space-stats-diff-edge);
  min-inline-size: var(--stats-diff-min);
  padding: var(--space-stats-diff);
  border-radius: var(--radius-stats-diff);
  background-color: color-mix(in srgb, var(--trend) var(--stats-diff-bg-mix), transparent);
  color: var(--trend);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
  text-align: center;

  &.up {
    --trend: var(--color-stats-diff-up);
  }

  &.down {
    --trend: var(--color-stats-diff-down);
  }

  &.flat {
    --trend: var(--color-stats-diff-flat);
  }
}

/* OG's metascore_class: 70 and up green, 40 and up yellow, red below. */
.high {
  --metascore: var(--color-metascore-high);
}

.medium {
  --metascore: var(--color-metascore-medium);
}

.low {
  --metascore: var(--color-metascore-low);
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .row,
  .track {
    transition: none;
  }
}
</style>
