<!--
  The latest commits on main, straight from GitHub, under a running date header for each day: each one's type as a
  colored tile with its icon, the site section as a tag in the tile's color and the subject, who wrote it and a link to it. The full history is a
  button away on GitHub.
-->
<script lang="ts">
import PanelHeading from '$lib/components/dashboard/PanelHeading.svelte';
import PanelHelp from '$lib/components/dashboard/PanelHelp.svelte';
import LinkButton from '$lib/components/button/LinkButton.svelte';
import TagPills from '$lib/components/labels/TagPills.svelte';
import Icon from '$lib/icons/Icon.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import github from '$lib/icons/brands/github.svg?raw';
import { commitTypeTile } from './github/commitTypeTile.ts';
import type { AboutCommit } from './github/toAboutCommit.ts';
import { ogRepoUrls } from './ogRepoUrls.ts';

interface Props {
  /** Null while GitHub is still answering. */
  commits: readonly AboutCommit[] | null;
  /** `YYYY-MM-DD` in UTC, for "Today". */
  today: string;
}

const { commits, today }: Props = $props();

/** The feed shows this many; the full history is on GitHub. */
const SHOWN = 20;

const days = $derived(
  (commits ?? []).slice(0, SHOWN).reduce<{ day: string; commits: AboutCommit[] }[]>((groups, commit) => {
    const last = groups.at(-1);
    if (last?.day === commit.day) {
      return [...groups.slice(0, -1), { day: last.day, commits: [...last.commits, commit] }];
    }
    return [...groups, { day: commit.day, commits: [commit] }];
  }, []),
);

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Today · Oct 23", "Yesterday · Oct 22", then the weekday: "Monday · Oct 20". */
const dayLabel = (day: string) => {
  const date = new Date(`${day}T12:00:00Z`);
  const daysAgo = Math.round((Date.parse(`${today}T12:00:00Z`) - date.getTime()) / DAY_MS);
  const when = daysAgo === 0
    ? 'Today'
    : daysAgo === 1
    ? 'Yesterday'
    : date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  return `${when} · ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`;
};
</script>

<!-- Commits live on GitHub, and resolve() only takes og's own routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<section class="commits" aria-labelledby="about-commits" aria-busy={commits === null}>
  <PanelHeading id="about-commits" title="Recently Landed" icon={github} loading={commits === null} seeMore={{ href: ogRepoUrls.commits, text: 'All commits' }} />
  <PanelHelp>What's new in OG Redux, straight from the commit log.</PanelHelp>
  {#each days as group (group.day)}
    <h3 class="day">{dayLabel(group.day)}</h3>
    <ul>
      {#each group.commits as commit (commit.sha)}
        {@const tile = commitTypeTile(commit.type)}
        <li>
          <span class="tile" style:--tile={tile.color} title={tile.label}>
            <Icon svg={tile.icon} label={tile.label} />
          </span>
          <p>
            <span class="section"><TagPills tags={[{ text: commit.section, tint: tile.color }]} /></span>{commit.subject}
          </p>
          <span class="sha">
            {#if commit.author}
              <Tooltip text={commit.author.login}>
                {#snippet trigger(tooltip)}
                  <img src={commit.author?.avatar} alt={commit.author?.login} {...tooltip} />
                {/snippet}
              </Tooltip>
            {/if}
            <a href={commit.href} target="_blank" rel="noopener">{commit.sha}</a>
          </span>
        </li>
      {/each}
    </ul>
  {/each}
  {#if commits}
    <p class="more"><LinkButton href={ogRepoUrls.commits} variant="outline" external>Full commit history on GitHub</LinkButton></p>
  {/if}
</section>

<style>
.commits {
  min-inline-size: 0;
  background-color: transparent;
}

.more {
  margin: 0;
}

/* A tracked, uppercase day label with a rule running out to the edge. */
.day {
  position: sticky;
  inset-block-start: var(--header-height);
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--about-day-rule-gap);
  margin: 0;
  padding: var(--about-week-head-padding);
  background: var(--color-home-bg);
  color: var(--color-home-muted);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-home-label);
  text-transform: uppercase;

  /* The first one stands off the tagline above it. */
  :global(.help) + & {
    margin-block-start: var(--about-day-first-space);
  }

  &::after {
    content: '';
    flex: 1;
    block-size: 1px;
    background: var(--color-home-line);
  }
}

ul {
  margin: 0 0 var(--gutter);
  padding: 0;
  list-style: none;
}

li {
  display: grid;
  grid-template-columns: var(--about-commit-columns);
  gap: var(--about-change-gap);
  align-items: center;
  padding-block: var(--about-change-padding);
}

/* The commit's type: its icon, solid white on the type's color. */
.tile {
  display: grid;
  place-items: center;
  inline-size: var(--about-commit-tile);
  block-size: var(--about-commit-tile);
  border-radius: var(--radius-object);
  background: var(--tile);
  color: var(--color-text-inverse);
  font-size: var(--font-size-about-commit-icon);
}

p {
  margin: 0;
  color: var(--color-home-soft);
}

/* The site section as a glass tag in the commit type's color, in line before the subject. */
.section {
  display: inline-flex;
  margin-inline-end: var(--about-commit-tag-gap);
  vertical-align: middle;
}

.sha {
  display: flex;
  align-items: center;
  gap: var(--about-repo-gap);
  font-family: var(--font-mono);
  font-size: var(--font-size-small);

  & a {
    color: var(--color-home-muted);

    &:is(:hover, :focus-visible) {
      color: var(--color-home-text);
    }
  }

  & img {
    inline-size: var(--about-week-avatar);
    block-size: var(--about-week-avatar);
    border-radius: 50%;
  }
}
</style>
