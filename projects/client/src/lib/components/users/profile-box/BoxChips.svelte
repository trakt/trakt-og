<!-- A profile box's labels, OG's small dark chips; `alt` ones are light. -->
<script lang="ts">
interface Props {
  chips: readonly { readonly text: string; readonly alt?: boolean }[];
}

const { chips }: Props = $props();
</script>

<p class="chips">
  {#each chips as chip, i (i)}<span class={['chip', { alt: chip.alt }]}>{chip.text}</span>{/each}
</p>

<style>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 0 0 6px;
}

.chip {
  padding: var(--profile-chip-padding);
  border-radius: var(--radius-profile-chip);
  background-color: var(--color-profile-chip);
  font-family: var(--font-headings);
  font-size: var(--font-size-profile-chip);
  font-weight: var(--font-weight-headings);
  line-height: 1;
  white-space: nowrap;

  &.alt {
    background-color: var(--color-profile-chip-alt);
  }
}
</style>
