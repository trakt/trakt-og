<!--
  A country's flag before its name, at the flag size. A country without a flag file gets nothing, or with `holdSpace`
  an empty slot the flag's size, so names in a column still line up.
    <CountryFlag code="us" />
-->
<script module lang="ts">
import { flagCountries } from './flagCountries.ts';

const flags: ReadonlySet<string> = new Set(flagCountries);
</script>

<script lang="ts">
const { code, holdSpace = false }: { code: string; holdSpace?: boolean } = $props();
</script>

{#if flags.has(code)}<img class="flag" src="/flags/{code}.svg" alt="" />{:else if holdSpace}<span class="flag"
  ></span>{/if}

<style>
.flag {
  flex: none;
  inline-size: var(--country-flag-size);
  block-size: var(--country-flag-size);
}
</style>
