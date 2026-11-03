<!--
  My Shows & Movies as a signed-in viewer sees it: the My nav above the All nav, on a demo viewer's week.
-->
<script lang="ts">
import CalendarPage from '$lib/calendars/CalendarPage.svelte';
import Header from '$lib/components/header/Header.svelte';
import Specimen from '$lib/design/Specimen.svelte';

const { data } = $props();
</script>

<Specimen title="My Shows & Movies" bleed
  note="The real calendar page on a sample of the public feed. Its filters, layouts and dates work; ?vip=false shows it as everyone else sees it. Saved Filters, last in the sidebar, are this browser's own, the same as on the calendars: Save one (with a filter on) to see it; open it to change or delete it from Applied Filters.">
  <div class="site">
    <Header user={data.user} searchType={data.searchType} />
    <CalendarPage {data} />
  </div>
</Specimen>

<style>
/* The bar is fixed to this frame instead of the window, as it is on the page. */
.site {
  contain: layout;
}
</style>
