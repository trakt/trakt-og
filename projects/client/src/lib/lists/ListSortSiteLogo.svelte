<!--
  A site's logo in the sort menu: before its row's name, and on the trigger before the picked sort's short name
  ("[IMDb] Votes"). Every logo is drawn the same width, so they look alike and the names after them line up.
  `alt` names the site where no text does.
-->
<script lang="ts">
import imdb from '$lib/assets/sites/imdb-solid.svg';
import metacritic from '$lib/assets/sites/metacritic.png';
import tomatometer from '$lib/assets/sites/rt/tomatometer-fresh.svg';
import tmdb from '$lib/assets/sites/tmdb.svg';
import trakt from '$lib/assets/sites/trakt.png';
import type { ListSortSite } from './listItemSorts.ts';

const LOGOS: Readonly<Record<ListSortSite, string>> = { trakt, imdb, tmdb, rt: tomatometer, metacritic };

const { site, alt = '' }: { site: ListSortSite; alt?: string } = $props();
</script>

<span class="site-logo"><img class={site} src={LOGOS[site]} {alt} /></span>

<style>
.site-logo {
  display: inline-flex;
  flex: none;
  align-items: center;
  inline-size: var(--menu-site-logo-width);
  vertical-align: middle;

  & img {
    inline-size: 100%;
    block-size: auto;
  }
}

.metacritic {
  border-radius: 50%;
}
</style>
