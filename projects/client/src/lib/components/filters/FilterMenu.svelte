<!--
  OG's filter eye (`#filter-fade-hide`): a dropdown behind an eye icon that turns red while any filter is on, with
  a red count badge. Fill it like a Dropdown: "Show All", then li.header groups of aria-pressed toggles.
  `variant="frame"` is the solid white eye in a Frame's title.
-->
<script lang="ts">
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import Icon from '$lib/icons/Icon.svelte';
import regularEye from '$lib/icons/regular/eye.svg?raw';
import solidEye from '$lib/icons/solid/eye.svg?raw';
import type { Snippet } from 'svelte';

interface Props {
  /** Something is filtered out. */
  active: boolean;
  /** The selected options, badged when above 0. */
  count?: number;
  variant?: 'default' | 'frame';
  children: Snippet;
}

const { active, count = 0, variant = 'default', children }: Props = $props();
</script>

<span class={['filter-menu', variant, { active }]}>
  <Dropdown variant="icon" label={count > 0 ? `Filters (${count} on)` : 'Filters'}>
    {#snippet trigger()}<span class="eye"><Icon svg={variant === 'frame' ? solidEye : regularEye} />{#if count > 0}<span
          class="badge"
          aria-hidden="true"
        >{count.toLocaleString('en-US')}</span>{/if}</span>{/snippet}
    {@render children()}
  </Dropdown>
</span>

<style>
.filter-menu {
  position: relative;
  display: inline-flex;
  color: var(--color-tool);
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  font-weight: normal;

  &:hover {
    color: var(--color-tool-hover);
  }

  &.frame {
    color: var(--color-filter-icon-frame);
    font-size: var(--font-size-filter-icon-frame);
  }

  &.active {
    color: var(--brand-primary);
    --caret-color: var(--brand-primary);
  }
}

.eye {
  position: relative;
  display: inline-flex;
  font-size: var(--font-size-tool);
  line-height: 1;
  transition: color 0.5s;

  .frame & {
    font-size: inherit;
  }
}

/* The count of filters that are on, over the eye's top-right. */
.badge {
  position: absolute;
  inset-block-start: calc(var(--tool-badge-size) / -2);
  inset-inline-end: calc(var(--tool-badge-size) / -2);
  min-inline-size: var(--tool-badge-size);
  block-size: var(--tool-badge-size);
  padding-inline: var(--space-tool-badge);
  border-radius: var(--tool-badge-size);
  background-color: var(--brand-primary);
  color: var(--color-text-inverse);
  font-family: var(--font-headings);
  font-size: var(--font-size-tool-badge);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--tool-badge-size);
  text-align: center;
  pointer-events: none;
}
</style>
