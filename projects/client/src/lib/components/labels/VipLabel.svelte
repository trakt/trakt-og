<!--
  OG's VIP label: the round Trakt logo and "VIP" on a red pill, an OG or EP tag, and a star
  with the year count past one year. Staff get "Director" instead. It sits after a name, usually in a heading.
  The tag and the years show OG's tooltips on top . They stay out of the tab order, since a
  label repeats on every comment and list row: the years are in the text, and the tag's full name is its description.
  `quiet` is a comment header's: a round red pill the size of its outline tags, with the tag and the years inside it.
    <VipLabel badge={toVipBadge(user)} />
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import star from '$lib/icons/solid/star.svg?raw';
import trakt from '$lib/icons/trakt/trakt-v2.svg?raw';
import type { VipBadge } from '$lib/users/VipBadge';

interface Props {
  badge: VipBadge;
  pill?: boolean;
  small?: boolean;
  quiet?: boolean;
}

const { badge, pill = false, small = false, quiet = false }: Props = $props();
const years = $derived(badge.kind === 'vip' ? badge.years : null);
</script>

<span class={['label-vip', { 'with-years': years, pill, small, quiet }]}>
  {#if !pill && !quiet}<span class="mark"><Icon svg={trakt} /></span>{/if}
  <span class="text">{badge.kind === 'director' ? 'Director' : 'VIP'}</span>
  {#if badge.kind === 'vip' && badge.tag}
    {@const tag = badge.tag}
    <Tooltip text={tag.title}>
      {#snippet trigger(tooltip)}<abbr class="tag" {...tooltip}>{tag.text}</abbr>{/snippet}
    </Tooltip>
  {/if}
  {#if years}
    <Tooltip text="{years} years">
      {#snippet trigger(tooltip)}
        <span class="years" {...tooltip}>
          <Icon svg={star} />
          <span class="years-text">{years}<span class="visually-hidden">&nbsp;years</span></span>
        </span>
      {/snippet}
    </Tooltip>
  {/if}
</span>

<style>
.label-vip {
  position: relative;
  display: inline-block;
  margin: 0 0 5px 10px;
  padding-inline-start: 28px;
  border-radius: var(--radius-label-vip);
  background-color: var(--brand-primary);
  color: var(--color-text-inverse);
  font-family: var(--font-headings);
  font-size: var(--font-size-label);
  font-weight: var(--font-weight-headings);
  line-height: 1;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-shadow: none;
  vertical-align: middle;

  &.with-years {
    margin-inline-end: 25px;
  }
}

/* Centered top to bottom, so the round logo keeps an even ring of red at any label size. */
.mark {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 3px;
  display: flex;
  align-items: center;
  font-size: 125%;
  line-height: 1;

  & :global(.icon) {
    translate: 0 var(--label-vip-mark-shift);
  }
}

.text {
  display: inline-block;
  padding: 5px 6px 5px 0;
}

.tag {
  display: inline-block;
  margin-block: -5px;
  padding: 5px;
  background-color: var(--color-label-ep);
  text-decoration: none;
}

.years {
  position: absolute;
  inset-inline-end: -28px;
  z-index: 0;
  display: inline-block;
  font-size: var(--font-size-label-star);
  letter-spacing: 0;
}

.years-text {
  position: absolute;
  inset-block-start: 0;
  inset-inline: 0;
  color: var(--color-label-years);
  font-size: var(--font-size-label-years);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 25px;
  text-align: center;
}

/* `.label-vip.piller.light-bg` */
.small {
  margin-block: 0;
  padding-inline-start: var(--label-vip-small-indent);
  font-size: var(--font-size-label-vip-small);

  & .text {
    padding: var(--label-vip-small-padding);
  }
}

.pill {
  margin: -3px 0 0 5px;
  padding-inline-start: 0;
  border-radius: 2px;
  font-size: var(--font-size-pill);
  letter-spacing: 0;

  & .text,
  & .tag {
    margin-block: 0;
    padding: 2px 4px;
  }

  & .tag {
    border-radius: 0 2px 2px 0;
  }

  & .years {
    inset-block-start: -6px;
    color: var(--color-label-years-light-bg);
  }

  & .years-text {
    color: var(--color-text-inverse);
    font-size: var(--font-size-label-years-pill);
    font-weight: var(--font-weight-headings);
  }
}

/*
  A comment header's: the outline tags' height, padding, size and weight, filled red, in sentence case ("Director"),
  with the OG or EP tag as a darker segment and the years star inside. The pill's round ends clip the segments.
*/
.label-vip.quiet {
  display: inline-flex;
  align-items: stretch;
  block-size: var(--comment-tag-height);
  margin: 0;
  padding: 0;
  overflow: hidden;
  border-radius: var(--radius-comment-tag);
  font-size: var(--font-size-comment-tag);
  letter-spacing: 0;
  text-transform: none;
  vertical-align: middle;

  & .text,
  & .tag,
  & .years {
    display: inline-flex;
    align-items: center;
    margin: 0;
    padding: var(--comment-tag-padding);
  }

  & .tag {
    font-size: inherit;
  }

  & .years {
    position: static;
    gap: var(--comment-tag-gap);
    font-size: var(--font-size-comment-tag-icon);
  }

  & .years-text {
    position: static;
    color: inherit;
    font-size: var(--font-size-comment-tag);
    font-weight: inherit;
    line-height: 1;
  }

  /* The years follow the name: no gap before them, unless the darker tag sits between. */
  & .text + .years {
    padding-inline-start: 0;
  }
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
