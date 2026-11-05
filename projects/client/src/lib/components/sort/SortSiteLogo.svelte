<!--
  A site's logo in the sort menu: before its row's name, and on the trigger before the picked sort's short name
  ("[IMDb] Votes"). Every logo is drawn the same width, so they look alike and the names after them line up.
  `alt` names the site where no text does.
-->
<script lang="ts">
import imdb from '#lib/assets/sites/imdb-solid.svg';
import metacritic from '#lib/assets/sites/metacritic.png';
import tomatometer from '#lib/assets/sites/rt/tomatometer-fresh.svg';
import tmdb from '#lib/assets/sites/tmdb.svg';
import trakt from '#lib/assets/sites/trakt.png';
import type { SortSite } from './sortMenu.ts';

const LOGOS: Readonly<Record<SortSite, string>> = { trakt, imdb, tmdb, rt: tomatometer, metacritic };

const { site, alt = '' }: { site: SortSite; alt?: string } = $props();
</script>

<span class="site-logo"><img class={site} src={LOGOS[site]} {alt} /></span>

<style>
/* A square every logo fits inside, centred on the name's capitals rather than its x-height. */
.site-logo {
  display: inline-block;
  flex: none;
  inline-size: var(--menu-site-logo-width);
  block-size: var(--menu-site-logo-width);
  vertical-align: calc((1cap - var(--menu-site-logo-width)) / 2);

  & img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
  }
}

.metacritic {
  border-radius: 50%;
}
</style>
