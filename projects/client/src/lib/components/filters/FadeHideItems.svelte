<!--
  Shared Show All, Fade and Hide toggle groups inside a FilterMenu. With both, Fade and Hide sit side by side.
  `hideDisabled` turns the Hide toggles off, each with that reason as its tooltip.
-->
<script lang="ts" generics="Option extends string">
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';

interface Props {
  value: { fade: readonly Option[]; hide: readonly Option[] };
  fadeOptions: readonly { id: Option; label: string }[];
  hideOptions?: readonly { id: Option; label: string }[];
  hideDisabled?: string;
  onchange: (next: { fade: Option[]; hide: Option[] }) => void;
  onreset?: () => void;
}
const { value, fadeOptions, hideOptions = fadeOptions, hideDisabled, onchange, onreset }: Props = $props();
function toggle(section: 'fade' | 'hide', id: Option) {
  onchange({
    fade: [...value.fade],
    hide: [...value.hide],
    [section]: value[section].includes(id) ? value[section].filter((other) => other !== id) : [...value[section], id],
  });
}
function reset() {
  onchange({ fade: [], hide: [] });
  onreset?.();
}
</script>
<ul>
  <li><button type="button" onclick={reset}>Show All</button></li>
</ul>
<hr />
<div class={['groups', { columns: fadeOptions.length > 0 && hideOptions.length > 0 }]}>
  {#each [['fade', 'Fade', fadeOptions], ['hide', 'Hide', hideOptions]] as const as [section, heading, options] (section)}
    {#if options.length > 0}
      <ul>
        <li class="header" role="presentation">{heading}</li>
        {#each options as option (option.id)}
          {#if section === 'hide' && hideDisabled}
            <li><Tooltip text={hideDisabled} placement="right">{#snippet trigger(tooltip)}<button type="button" aria-pressed="false" aria-disabled="true" {...tooltip}>{option.label}</button>{/snippet}</Tooltip></li>
          {:else}
            <li><button type="button" aria-pressed={value[section].includes(option.id)} onclick={() => toggle(section, option.id)}>{option.label}</button></li>
          {/if}
        {/each}
      </ul>
    {/if}
  {/each}
</div>

<style>
[aria-disabled='true'] {
  opacity: var(--opacity-action-disabled);
  cursor: default;
}

.columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  & > ul + ul {
    padding-inline-start: var(--space-menu);
    border-inline-start: 1px solid var(--color-menu-border);
  }
}
</style>
