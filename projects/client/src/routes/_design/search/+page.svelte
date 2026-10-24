<!--
  The search results in the image type `?image=` names (poster, thumb, screenshot, fanart, logo or banner), as the
  demo viewer sees them.
-->
<script lang="ts">
import Footer from '$lib/components/footer/Footer.svelte';
import Header from '$lib/components/header/Header.svelte';
import SearchPage from '$lib/search/SearchPage.svelte';

const { data } = $props();
</script>

<Header user={data.user} searchType={data.searchType} />
<main id="content">
  <SearchPage {data} />
</main>
<Footer />
