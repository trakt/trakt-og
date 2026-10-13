<!--
  The VIP label: one round red pill with the Trakt logo and "VIP" (or "Director" for staff), the OG or EP tag as a
  darker red segment, and past one year a light gray segment with a black star and the year count. It sits after a name.
  The default size goes in headings; `pill`, `small` and `quiet` are the small size for comment headers, cards, list
  rows and promotional lines, and only change the spacing around it. The tag and the years show tooltips on top. They
  stay out of the tab order, since a label repeats on every comment and list row: the years are in the text, and the
  tag's full name is its description.
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
  /** After a name in a card or a list row. */
  pill?: boolean;
  /** In a promotional line, like the account welcome. */
  small?: boolean;
  /** In a comment header, next to its outline tags. */
  quiet?: boolean;
}

const { badge, pill = false, small = false, quiet = false }: Props = $props();
const years = $derived(badge.kind === 'vip' ? badge.years : null);
</script>

<span class={['label-vip', { compact: pill || small || quiet, pill, quiet }]}>
  <span class="name"><span class="mark"><Icon svg={trakt} /></span>{badge.kind === 'director' ? 'Director' : 'VIP'}</span>
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
          <Icon svg={star} />{years}<span class="visually-hidden">&nbsp;years</span>
        </span>
      {/snippet}
    </Tooltip>
  {/if}
</span>

<style>
.label-vip {
  display: inline-flex;
  align-items: stretch;
  block-size: var(--label-vip-height);
  margin-inline-start: 10px;
  overflow: hidden;
  border-radius: calc(var(--label-vip-height) / 2);
  background-color: var(--brand-primary);
  color: var(--color-text-inverse);
  font-family: var(--font-headings);
  font-size: var(--font-size-label-vip);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1;
  letter-spacing: var(--label-vip-tracking);
  text-transform: uppercase;
  text-shadow: none;
  vertical-align: middle;
  white-space: nowrap;

  &.compact {
    block-size: var(--label-vip-height-small);
    border-radius: calc(var(--label-vip-height-small) / 2);
    font-size: var(--font-size-label-vip-small);
  }

  &.pill {
    margin-inline-start: 5px;
  }

  &.quiet {
    margin-inline-start: 0;
  }
}

.name,
.tag,
.years {
  display: inline-flex;
  align-items: center;
}

.name {
  gap: var(--label-vip-gap);
  padding: var(--label-vip-name-padding);

  .compact & {
    gap: var(--label-vip-gap-small);
    padding: var(--label-vip-name-padding-small);
  }
}

/* Centered top to bottom, so the round logo keeps an even ring of red at any size. */
.mark {
  display: flex;
  font-size: var(--label-vip-mark);

  & :global(.icon) {
    translate: 0 var(--label-vip-mark-shift);
  }

  .compact & {
    font-size: var(--label-vip-mark-small);
  }
}

.tag,
.years {
  padding: var(--label-vip-segment-padding);

  .compact & {
    padding: var(--label-vip-segment-padding-small);
  }
}

.tag {
  background-color: var(--color-label-ep);
  text-decoration: none;
}

.years {
  gap: var(--label-vip-years-gap);
  background-color: var(--color-label-years-bg);
  color: var(--color-label-years-text);
  font-size: var(--font-size-label-vip-years);
  letter-spacing: 0;

  & :global(.icon) {
    font-size: var(--label-vip-star);
  }

  .compact & {
    font-size: var(--font-size-label-vip-years-small);

    & :global(.icon) {
      font-size: var(--label-vip-star-small);
    }
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
