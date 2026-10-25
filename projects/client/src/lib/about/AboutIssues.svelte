<!--
  The sidebar beside What shipped: Coming Attractions (the newest open issues), titled like a trailer's green-band card,
  and Previously On (the latest closed), titled like a VCR rewinding,
  each with its count as a tag that links to the rest on GitHub, and every issue's label and the day it opened or
  closed as tags. A panel with no issues says so, with a way to open the first one.
-->
<script lang="ts">
import LinkButton from '$lib/components/button/LinkButton.svelte';
import TagPills from '$lib/components/labels/TagPills.svelte';
import Spinner from '$lib/components/loading/Spinner.svelte';
import Icon from '$lib/icons/Icon.svelte';
import circleCheck from '$lib/icons/solid/circle-check.svg?raw';
import openIcon from '$lib/icons/regular/circle-dot.svg?raw';
import closedIcon from '$lib/icons/regular/circle-check.svg?raw';
import sparkles from '$lib/icons/solid/sparkles.svg?raw';
import type { AboutGithub } from './github/fetchAboutGithub.ts';
import { ogRepoUrls } from './ogRepoUrls.ts';
import { toAboutIssue } from './toAboutIssue.ts';

interface Props {
  open: AboutGithub['open'] | null;
  closed: AboutGithub['closed'] | null;
  /** GitHub is still answering. */
  loading: boolean;
}

const { open, closed, loading }: Props = $props();

/** Each panel lists this many; the count tag links to the rest on GitHub. */
const SHOWN = 5;

const panels = $derived([
  {
    id: 'about-open',
    title: 'Coming Attractions',
    state: 'open' as const,
    list: open,
    href: ogRepoUrls.openIssues,
    tint: 'var(--color-github-open)',
    icon: openIcon,
    theme: 'trailer' as const,
    fine: 'Sneak peek · subject to change',
    empty: {
      icon: circleCheck,
      title: 'All caught up',
      text: 'No open issues right now. Spotted something, or have an idea?',
      action: { href: ogRepoUrls.newBug, text: 'Open an Issue' },
    },
  },
  {
    id: 'about-closed',
    title: 'Previously On…',
    state: 'closed' as const,
    list: closed,
    href: ogRepoUrls.closedIssues,
    tint: 'var(--color-github-closed)',
    icon: closedIcon,
    theme: 'vcr' as const,
    fine: 'SP · Rewind',
    empty: {
      icon: sparkles,
      title: 'Nothing has aired yet',
      text: 'Closed issues show up here once the first one ships.',
      action: { href: ogRepoUrls.openIssues, text: 'All Open Issues' },
    },
  },
].filter((panel) => loading || panel.list));
</script>

<!-- Issues live on GitHub, and resolve() only takes og's own routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<aside class="issues" aria-label="Issues on GitHub">
  {#each panels as panel (panel.id)}
    {@const issues = panel.list?.issues.slice(0, SHOWN).map((issue) => toAboutIssue(issue, panel.state)) ?? []}
    <section class="panel" aria-labelledby={panel.id}>
      <div class={['head', panel.theme]}>
        <p class="fine">{panel.fine}</p>
        <h2 id={panel.id}>{#if panel.theme === 'vcr'}<span class="rewind" aria-hidden="true">◀◀</span>{/if}{panel.title}</h2>
        {#if panel.list}
          <TagPills
            tags={[{
              lead: panel.list.total.toLocaleString(),
              text: '',
              label: `${panel.list.total.toLocaleString()} ${panel.state} ${panel.list.total === 1 ? 'issue' : 'issues'}`,
              href: panel.href,
              tint: panel.tint,
              icon: panel.icon,
            }]}
          />
        {:else}
          <Spinner />
        {/if}
      </div>
      {#if panel.list && issues.length === 0}
        <div class="empty">
          <span class="empty-icon"><Icon svg={panel.empty.icon} /></span>
          <h3>{panel.empty.title}</h3>
          <p>{panel.empty.text}</p>
          <LinkButton href={panel.empty.action.href} variant="outline">{panel.empty.action.text}</LinkButton>
        </div>
      {:else if issues.length > 0}
        <ul>
          {#each issues as issue (issue.number)}
            <li>
              <a href={issue.href} target="_blank" rel="noopener">
                <span class={['number', { closed: panel.state === 'closed' }]}>#{issue.number}</span>
                <span class="title">{issue.title}</span>
                <span class="tags">
                  <TagPills tags={[...(issue.tag ? [issue.tag] : []), { text: issue.date }]} />
                </span>
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/each}
</aside>

<style>
.issues {
  display: grid;
  gap: var(--gutter);
}

.panel {
  display: grid;
  justify-items: start;
  padding-block-end: var(--about-panel-gap);
  overflow: hidden;
  border-radius: var(--about-banner-radius);
  background: var(--color-panel-gray);
  box-shadow: 0 0 0 1px var(--color-home-line);
}

/* The title band, themed per panel: open issues as a trailer's green-band card, closed ones as a VCR rewinding. */
/* The fine print runs across the top, then the title with its count on the same line. */
.head {
  justify-self: stretch;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--about-panel-fine-gap) var(--about-change-gap);
  padding: var(--about-panel-head-padding);
  background: var(--color-about-panel-head);

  & .fine {
    grid-column: 1 / -1;
  }

  & h2 {
    margin: 0;
    font-size: var(--font-size-h4);
  }

  & > :global(:is(.tag-pills, .spinner)) {
    grid-area: 2 / 2;
  }
}

.fine {
  margin: 0;
  font-size: var(--font-size-about-panel-fine);
  letter-spacing: var(--letter-spacing-about-panel-fine);
  text-transform: uppercase;
}

/* The green band card before a trailer, framed by its thin inner line. */
.trailer {
  color-scheme: dark;
  color: var(--color-home-text);
  position: relative;
  background: var(--color-about-trailer-band);

  /* The frame rounds with the panel's corners, inset by its own gap. */
  &::after {
    content: '';
    position: absolute;
    inset: var(--about-trailer-inset);
    border: 1px solid var(--color-about-trailer-line);
    border-radius: calc(var(--about-banner-radius) - var(--about-trailer-inset));
    pointer-events: none;
  }

  & .fine {
    color: var(--color-about-trailer-fine);
  }

  & h2 {
    font-weight: var(--font-weight-headings-heavy);
    letter-spacing: var(--letter-spacing-about-trailer-title);
    text-transform: uppercase;
  }
}

/* A VCR's on-screen display over a rewinding tape: monospace, a soft glow and faint scanlines. */
.vcr {
  color-scheme: dark;
  background: var(--about-vcr-scanlines), var(--color-about-vcr-bg);

  & .fine,
  & h2 {
    font-family: var(--font-mono);
    color: var(--color-about-vcr-text);
    text-shadow: var(--text-shadow-about-vcr);
  }

  & .fine {
    color: var(--color-about-vcr-fine);
  }

  & h2 {
    font-weight: var(--font-weight-headings-heavy);
    text-transform: uppercase;
  }
}

.rewind {
  margin-inline-end: var(--about-vcr-rewind-gap);
  letter-spacing: var(--letter-spacing-about-vcr-rewind);
}

ul,
.empty {
  justify-self: stretch;
  margin: 0;
  padding: var(--about-panel-body-padding);
  list-style: none;
}

.panel > :global(.link-button) {
  margin: var(--about-panel-button-space) var(--about-panel-inline) 0;
}

/* The number column fits a four-digit issue, right aligned so the titles start in one line. */
li a {
  display: grid;
  grid-template-columns: var(--about-issue-number) minmax(0, 1fr);
  gap: var(--about-flow-gap) var(--about-change-gap);
  padding-block: var(--about-issue-padding);
  color: var(--color-home-soft);

  &:is(:hover, :focus-visible) {
    text-decoration: none;

    & .title {
      color: var(--color-home-text);
      text-decoration: underline;
    }
  }
}

.number {
  padding-block-start: var(--about-issue-number-nudge);
  font-family: var(--font-mono);
  font-size: var(--font-size-small);
  text-align: end;
  color: var(--color-about-terminal-comment);

  &.closed {
    color: var(--color-about-issue-closed);
  }
}

.title {
  font-size: var(--font-size-base);
}

.tags {
  grid-column: 2;
}

.empty {
  display: grid;
  justify-items: center;
  gap: var(--about-repo-gap);
  padding-block-start: var(--about-empty-top);
  text-align: center;

  & h3 {
    margin: 0;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-headings-heavy);
  }

  & p {
    margin: 0 0 var(--about-repo-gap);
    max-inline-size: var(--about-empty-width);
    color: var(--color-home-muted);
  }
}

.empty-icon {
  display: grid;
  place-items: center;
  inline-size: var(--about-card-icon);
  block-size: var(--about-card-icon);
  margin-block-end: var(--about-repo-gap);
  border-radius: 50%;
  background: var(--color-about-card-icon);
  color: var(--brand-primary);
  font-size: var(--about-empty-glyph);
}

/* On a small tablet the sidebar drops under the feed, so its two panels sit side by side. */
@container (width < 1000px) {
  .issues {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}
</style>
