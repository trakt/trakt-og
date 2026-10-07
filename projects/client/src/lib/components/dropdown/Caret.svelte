<!--
  The solid caret after a control that opens a menu: dropdown triggers and toolbar icon tools.
    <Caret />
-->
<script lang="ts">
import Icon from '$lib/icons/Icon.svelte';
import caretDown from '$lib/icons/solid/caret-down.svg?raw';
</script>

<span class="caret"><Icon svg={caretDown} /></span>

<style>
.caret {
  display: inline-flex;
  color: var(--caret-color, var(--color-control-muted));
  font-size: var(--font-size-caret);
  line-height: 1;
  transition: color 0.2s;
}
</style>
