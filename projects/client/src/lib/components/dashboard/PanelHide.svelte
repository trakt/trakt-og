<!--
  A list panel's eye, after its sort: the list page's Hide toggles alone, red with a count while any is on. The panel
  keeps its picks, not the list page's cookie.
    <PanelHide options={panelHideOptions(...)} {hide} disabled={panelHideDisabled(list)} onchange={(next) => ...} />
-->
<script lang="ts">
import FadeHideItems from '#lib/components/filters/FadeHideItems.svelte';
import FilterMenu from '#lib/components/filters/FilterMenu.svelte';

interface Props {
  options: readonly { id: string; label: string }[];
  hide: readonly string[];
  /** Why a toggle is off, as its tooltip. */
  disabled?: (id: string) => string | undefined;
  onchange: (hide: string[]) => void;
}

const { options, hide, disabled, onchange }: Props = $props();
</script>

<FilterMenu active={hide.length > 0} count={hide.length}>
  <FadeHideItems value={{ fade: [], hide }} fadeOptions={[]} hideOptions={options} hideDisabled={disabled}
    onchange={(next) => onchange(next.hide)} />
</FilterMenu>
