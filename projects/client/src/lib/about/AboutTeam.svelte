<!--
  The Trakt team: a roster of avatar chips (name and city) beside one panel for whoever's picked. The panel is a small
  profile header over one of their favorites' fanart: the avatar, name and the year they joined, the network cards'
  tags (location, and their plays in the watched purple) and a shuffled handful of their favorites. Arrow keys move
  through the roster.
-->
<script lang="ts">
import CommentTag from '$lib/components/comments/CommentTag.svelte';
import PanelHeading from '$lib/components/dashboard/PanelHeading.svelte';
import PanelHelp from '$lib/components/dashboard/PanelHelp.svelte';
import SeeMore from '$lib/components/see-more/SeeMore.svelte';
import RollingNumber from '$lib/components/stats/RollingNumber.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import userGroup from '$lib/icons/regular/user-group.svg?raw';
import calendarLines from '$lib/icons/regular/calendar-lines.svg?raw';
import locationPin from '$lib/icons/solid/location-pin.svg?raw';
import checkThick from '$lib/icons/trakt/check-thick.svg?raw';
import type { AboutMemberPick } from './pickAboutTeam.ts';

const { team }: { team: readonly AboutMemberPick[] } = $props();

let selected = $state(0);
const member = $derived(team.at(selected) ?? team.at(0));

const episodes = $derived(team.reduce((sum, one) => sum + one.episodes, 0));
const movies = $derived(team.reduce((sum, one) => sum + one.movies, 0));

const city = (location: string | null) => location?.split(',').at(0)?.trim() ?? '';

function move(event: KeyboardEvent) {
  const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
  if (!step) return;
  event.preventDefault();
  selected = (selected + step + team.length) % team.length;
  const list = event.currentTarget as HTMLElement;
  list.querySelector<HTMLButtonElement>(`[data-index="${selected}"]`)?.focus();
}
</script>

<!-- A member's name and favorites link to og routes resolve() can't type from a string. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<section class="team" aria-labelledby="about-team">
  <div class="head">
    <div>
      <PanelHeading id="about-team" title="Trakt Team" icon={userGroup} />
      <PanelHelp>The people building Trakt, from all over the world.</PanelHelp>
    </div>
    <dl class="stats">
      {#each [
        { label: 'People', value: team.length, plays: false },
        { label: 'Watched episodes', value: episodes, plays: true },
        { label: 'Watched movies', value: movies, plays: true },
      ] as stat (stat.label)}
        <div class={{ plays: stat.plays }}>
          <dt>{stat.label}</dt>
          <dd><RollingNumber value={stat.value} /></dd>
        </div>
      {/each}
    </dl>
  </div>

  <div class="layout">
    <div class="roster" role="tablist" aria-label="The team" aria-orientation="vertical" tabindex="-1" onkeydown={move}>
      {#each team as one, index (one.slug)}
        <button
          type="button"
          class="chip"
          role="tab"
          id="about-member-{one.slug}"
          aria-selected={index === selected}
          aria-controls="about-member-panel"
          tabindex={index === selected ? 0 : -1}
          data-index={index}
          onclick={() => (selected = index)}
        >
          <img src={one.avatar} alt="" loading="lazy" decoding="async" />
          <span>{one.name}{#if one.location}<small>{city(one.location)}</small>{/if}</span>
        </button>
      {/each}
    </div>

    {#if member}
      <div class="panel" id="about-member-panel" role="tabpanel" aria-labelledby="about-member-{member.slug}">
        {#key member.slug}
          {#if member.cover}
            <img class="cover" src={member.cover} alt="" decoding="async" />
          {:else}
            <img class="cover blurred" src={member.avatar} alt="" decoding="async" />
          {/if}
          <a class="avatar" href="/users/{member.slug}" tabindex="-1" aria-hidden="true">
            <img src={member.avatar} alt="" decoding="async" />
          </a>
          <div class="who">
            <h3><a href="/users/{member.slug}">{member.name}</a></h3>
            <div class="lines">
            <p class="tags">
              {#if member.location}
                <CommentTag svg={locationPin} tone="following" tint><b class="place">{member.location}</b></CommentTag>
              {/if}
              {#if member.since}
                <CommentTag svg={calendarLines} tone="following" tint><span>Joined <b class="place">{member.since}</b></span></CommentTag>
              {/if}
            </p>
            <p class="tags">
              <CommentTag svg={checkThick} glyph tone="watched" tint>
                <span><b>{member.episodes.toLocaleString()}</b> episodes</span>
              </CommentTag>
              <CommentTag svg={checkThick} glyph tone="watched" tint>
                <span><b>{member.movies.toLocaleString()}</b> movies</span>
              </CommentTag>
            </p>
            </div>
          </div>
          {#if member.favorites.length > 0}
            <div class="favorites">
              <div class="favorites-head">
                <h4 id="about-member-favorites">Favorites</h4>
                <SeeMore href="/users/{member.slug}/favorites" text="View all" />
              </div>
              <ul aria-labelledby="about-member-favorites">
                {#each member.favorites as favorite (favorite.key)}
                  <li>
                    <Tooltip text={favorite.year ? `${favorite.title} (${favorite.year})` : favorite.title}>
                      {#snippet trigger(tooltip)}
                        <a href={favorite.href} {...tooltip}>
                          {#if favorite.poster}
                            <img src={favorite.poster} alt={favorite.title} loading="lazy" decoding="async" />
                          {:else}
                            <span class="no-poster">{favorite.title}</span>
                          {/if}
                        </a>
                      {/snippet}
                    </Tooltip>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        {/key}
      </div>
    {/if}
  </div>
</section>

<style>
.team {
  container-type: inline-size;
  margin-block: var(--about-api-space) var(--about-team-after);
  padding-block: var(--about-section-padding-block);
  padding-inline: max(var(--home-gutter), calc((100% - var(--home-content-width)) / 2));
  background-color: var(--color-about-team-bg);
}

.head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--gutter);
}

.stats {
  display: flex;
  margin: 0;

  & div {
    display: flex;
    flex-direction: column-reverse;
    align-items: end;
    padding-inline: var(--about-stat-gap);
    border-inline-start: 1px solid var(--color-home-line);

    &:first-child {
      border-inline-start: 0;
    }

    &:last-child {
      padding-inline-end: 0;
    }
  }

  & dt {
    font-size: var(--font-size-comment-tag);
    font-weight: var(--font-weight-headings-heavy);
    letter-spacing: var(--letter-spacing-home-label);
    text-transform: uppercase;
    color: var(--color-home-muted);
  }

  /* The rolling window leaves room under the digits for descenders they don't have, so the label tucks up into it. */
  & dd {
    margin: 0 0 var(--about-stat-tuck);
    font-family: var(--font-dashboard-panel-figures);
    font-size: var(--font-size-about-stat);
    font-weight: var(--font-weight-headings-heavy);
    color: var(--color-home-text);
  }

  & .plays dd {
    color: var(--color-about-stat-plays);
  }
}

.layout {
  display: grid;
  grid-template-columns: var(--about-roster-width) minmax(0, 1fr);
  gap: var(--gutter);
  margin-block-start: var(--about-team-help-space);
}

.roster {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: start;
  gap: var(--about-roster-gap);
}

.chip {
  display: flex;
  align-items: center;
  gap: var(--about-chip-gap);
  min-block-size: 0;
  padding: var(--about-chip-padding);
  border: 0;
  border-radius: var(--radius-object);
  background: var(--color-about-chip-bg);
  color: var(--color-home-soft);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
  text-align: start;
  line-height: var(--line-height-small);

  & img {
    flex: none;
    inline-size: var(--about-chip-avatar);
    block-size: var(--about-chip-avatar);
    border-radius: 50%;
    object-fit: cover;
  }

  & small {
    display: block;
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-headings-light);
    color: var(--color-home-muted);
  }

  &:hover {
    background: var(--color-about-chip-hover);
    color: var(--color-home-text);
  }

  &[aria-selected='true'] {
    background: var(--color-about-card-icon);
    box-shadow: inset 0 0 0 1px var(--brand-primary);
    color: var(--color-home-text);
  }
}

/* The member's panel sits on their fanart, so it's dark in either theme. */
.panel {
  color-scheme: dark;
  color: var(--color-home-text);
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: var(--about-panel-avatar) minmax(0, 1fr);
  align-content: start;
  align-items: center;
  gap: var(--gutter);
  padding: var(--about-member-padding);
  overflow: hidden;
  border-radius: var(--about-banner-radius);
  background: var(--color-about-member-bg);
  box-shadow: 0 0 0 1px var(--color-home-line);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--about-member-shade);
  }
}

.cover {
  position: absolute;
  inset: 0;
  z-index: -2;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  object-position: var(--home-hero-image-position);

  &.blurred {
    filter: var(--about-banner-blur);
    scale: var(--about-banner-blur-zoom);
  }
}

.avatar {
  inline-size: var(--about-panel-avatar);
  block-size: var(--about-panel-avatar);
  border-radius: 50%;
  box-shadow: var(--shadow-about-avatar);
  overflow: hidden;

  & img {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
}

.who {
  display: grid;
  justify-items: start;
  gap: var(--about-name-gap);
  min-inline-size: 0;
}

h3 {
  display: flex;
  align-items: center;
  gap: var(--about-chip-gap);
  margin: 0;
  font-size: var(--font-size-h3);

  & > a {
    color: var(--color-home-text);
    font-weight: var(--font-weight-headings-heavy);

    &:is(:hover, :focus-visible) {
      color: var(--brand-primary);
      text-decoration: none;
    }
  }

  & :global(b) {
    font-weight: var(--font-weight-headings-heavy);
  }
}

/* The two rows of tags sit as far apart as the tags in a row. */
.lines {
  display: grid;
  gap: var(--comment-tags-gap);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--comment-tags-gap);
  margin: 0;

  & b {
    font-weight: var(--font-weight-headings-heavy);
  }

  & .place {
    color: var(--color-home-text);
  }
}

.favorites {
  grid-column: 1 / -1;
  display: grid;
  gap: var(--about-panel-gap);

  & .favorites-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  & h4 {
    margin: 0;
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-headings-heavy);
    letter-spacing: var(--letter-spacing-home-label);
    text-transform: uppercase;
    color: var(--color-home-muted);
  }
}

.favorites ul {
  display: grid;
  grid-template-columns: repeat(var(--about-favorites), minmax(0, 1fr));
  gap: var(--gutter);
  margin: 0;
  padding: 0;
  list-style: none;

  & a {
    display: block;
    aspect-ratio: 2 / 3;
    overflow: hidden;
    border-radius: var(--radius-card-framed);
    box-shadow: var(--shadow-about-poster);
    transition: translate var(--about-hover-duration);

    &:is(:hover, :focus-visible) {
      translate: 0 var(--about-card-lift);
    }
  }

  & img {
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
}

.no-poster {
  display: grid;
  place-items: center;
  block-size: 100%;
  padding: var(--about-repo-gap);
  background: var(--color-home-bg);
  font-size: var(--font-size-small);
  text-align: center;
  color: var(--color-home-muted);
}

@container (width < 1000px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .roster {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .favorites a {
    transition: none;
  }
}
</style>
