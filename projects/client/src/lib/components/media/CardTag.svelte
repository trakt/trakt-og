<!--
  One of OG's card tags: a small rounded label in its kind's color, the brand red by default, or its own `color`. With
  `href` it's a link. Fanart cards stack them over the art; the dashboard schedule lines them up under a show.
    <CardTag text="Season Finale" kind="season-finale" />
-->
<script lang="ts">
import StatusDot from '$lib/components/status/StatusDot.svelte';
import Icon from '$lib/icons/Icon.svelte';
import type { CardTag } from './CardTag.ts';

const { text, icon, color, live = false, href, kind = 'primary' }: CardTag = $props();
</script>

<!-- Tag links point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<svelte:element this={href ? 'a' : 'span'} {href} class={['card-tag', kind, { live }]} style:--tag-color={color}
>{#if live}<StatusDot kind="live" />{/if}{#if icon}<Icon svg={icon} />{/if}{text}</svelte:element>

<style>
.card-tag {
  display: inline-flex;
  gap: var(--space-card-tag-icon);
  align-items: center;
  padding: 3px 5px;
  border-radius: var(--radius-card-tag);
  background-color: var(--tag-color);
  color: var(--color-card-text);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
  font-size: var(--font-size-card-tag);
  line-height: var(--line-height-headings);
  white-space: nowrap;
  text-decoration: none;

  /* A white dot, so it shows on the red. */
  &.live {
    --color-social-live: var(--color-card-text);
    --color-social-live-glow: var(--color-social-tag-live-glow);
  }
}

a.card-tag:is(:hover, :focus-visible) {
  color: var(--color-card-text);
  text-decoration: underline;
}

.primary {
  --tag-color: var(--brand-primary);
}

.premiere {
  --tag-color: var(--episode-season-premiere);
}

.generic {
  --tag-color: var(--gray);
}

.collect {
  --tag-color: var(--brand-quaternary);
}

.list {
  --tag-color: var(--brand-fifth);
}

.favorite {
  --tag-color: var(--brand-seventh);
}

.subscribe {
  --tag-color: var(--brand-eighth);
}

.series-premiere {
  --tag-color: var(--episode-series-premiere);
}

.season-premiere {
  --tag-color: var(--episode-season-premiere);
}

.mid-season-premiere {
  --tag-color: var(--episode-mid-season-premiere);
}

.mid-season-finale {
  --tag-color: var(--episode-mid-season-finale);
}

.season-finale {
  --tag-color: var(--episode-season-finale);
}

.series-finale {
  --tag-color: var(--episode-series-finale);
}

.bonus {
  --tag-color: var(--episode-bonus);
}

.trailer {
  --tag-color: var(--episode-trailer);
}
</style>
