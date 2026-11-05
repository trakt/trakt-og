<!--
  The taste match pill: the level's icon and the score on the cover's glass, then the level's name in its own segment,
  tinted in the level's color so it stands out. Soulmates' heart beats, Co-stars' name glows and Different universe's
  pill holds a few stars. With `onclick` it's a button (the profile cover's, which opens the breakdown); `large` is the
  breakdown dialog's header.
    <MatchBadge {match} onclick={openBreakdown} />
    <MatchBadge {match} large />
-->
<script lang="ts">
import Icon from '#lib/icons/Icon.svelte';
import { matchLevelIcon } from '#lib/users/match/matchLevelIcon.ts';
import type { UserMatch } from '#lib/users/match/UserMatch.ts';

interface Props {
  match: UserMatch;
  large?: boolean;
  onclick?: () => void;
}

const { match, large = false, onclick }: Props = $props();
const key = $derived(match.level.key);
const color = $derived(`var(--color-match-${key})`);
</script>

{#snippet content()}
  <span class="icon"><Icon svg={matchLevelIcon[key]} /></span>
  <span class="score"><b>{match.score}%</b> match</span>
  <span class="level">{match.level.label}</span>
{/snippet}

{#if onclick}
  <button type="button" class={['badge', key, { large }]} style:--match={color} aria-haspopup="dialog" {onclick}>
    {@render content()}
  </button>
{:else}
  <span class={['badge', key, { large }]} style:--match={color}>{@render content()}</span>
{/if}

<style>
/* CoverPill's glass; the level segment runs to the round end, cut on a slash like TitleTags' steps. */
.badge {
  --height: var(--profile-pill-height);
  --pad: var(--profile-pill-padding);
  --slant: var(--match-pill-slant);
  display: inline-flex;
  align-items: stretch;
  /* Its own width, so a grid parent never stretches it past its segment. */
  inline-size: max-content;
  min-block-size: 0;
  block-size: var(--height);
  padding: 0 0 0 var(--pad);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--match) var(--match-pill-border-mix), transparent);
  border-radius: calc(var(--height) / 2);
  background-color: var(--color-profile-pill-bg);
  backdrop-filter: var(--blur-profile-pill);
  color: var(--color-profile-pill-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-profile-pill);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-shadow: none;
  white-space: nowrap;

  &.large {
    --height: var(--match-level-pill-height);
    --pad: var(--match-level-pill-padding);
    --slant: var(--match-level-pill-slant);
    font-size: var(--font-size-match-level);
  }

  &.different-universe {
    background-image: var(--match-pill-starfield);
  }
}

button.badge:is(:hover, :focus-visible) {
  border-color: var(--match);
  background-color: var(--color-profile-button-hover-bg);
  box-shadow: var(--shadow-match-pill-hover) color-mix(in srgb, var(--match) var(--match-pill-glow-mix), transparent);
}

.icon,
.score,
.level {
  display: inline-flex;
  align-items: center;
}

.icon {
  color: var(--match);
}

.score {
  gap: var(--match-pill-score-gap);
  padding-inline: var(--space-xs-inline) calc(var(--slant) / 2 + var(--space-sm-inline));

  & b {
    color: var(--color-text-inverse);
    font-weight: var(--font-weight-headings-heavy);
  }
}

/* Pulled back under the score by the slant, and clipped a pixel past the slash so its line isn't cut in half. */
.level {
  position: relative;
  margin-inline-start: calc(-1 * var(--slant));
  padding-inline: calc(var(--slant) / 2 + var(--space-sm-inline)) var(--pad);
  clip-path: polygon(calc(var(--slant) - 1px) 0, 100% 0, 100% 100%, -1px 100%);
  background-color: color-mix(in srgb, var(--match) var(--match-pill-segment-mix), transparent);
  color: color-mix(in srgb, var(--match) var(--match-pill-label-mix), var(--color-text-inverse));
  font-weight: var(--font-weight-headings-heavy);

  /* The slash, drawn past the pill's edges so it runs into the border. */
  &::before {
    content: '';
    position: absolute;
    inset-block: -2px;
    inset-inline-start: -1px;
    inline-size: calc(var(--slant) + 2px);
    background: linear-gradient(
      to bottom right,
      transparent calc(50% - var(--match-pill-slash)),
      color-mix(in srgb, var(--match) var(--match-pill-border-mix), transparent) calc(50% - var(--match-pill-slash)),
      color-mix(in srgb, var(--match) var(--match-pill-border-mix), transparent) calc(50% + var(--match-pill-slash)),
      transparent calc(50% + var(--match-pill-slash))
    );
    pointer-events: none;
  }

  .co-stars & {
    text-shadow: var(--text-shadow-match-glow) var(--match);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .soulmates .icon {
    animation: heartbeat var(--duration-match-heartbeat) ease-in-out infinite;
  }
}

@keyframes heartbeat {
  0%,
  40%,
  100% {
    transform: scale(1);
  }

  20% {
    transform: scale(var(--scale-match-heartbeat));
  }
}
</style>
