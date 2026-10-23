<!-- The "Built on the Trakt API" banner under the header, with the current Trakt mark as the branding page's violet disc and a link to the developer portal. -->
<script lang="ts">
import TraktLogoMark from '$lib/components/brand/TraktLogoMark.svelte';
import LinkButton from '$lib/components/button/LinkButton.svelte';
import { traktUrls } from '$lib/traktUrls';
</script>

<section class="api" aria-labelledby="about-api">
  <span class="mark"><TraktLogoMark disc /></span>
  <div>
    <h2 id="about-api">Built on the Trakt API</h2>
    <p>
      <b>OG Redux</b> runs entirely on the public Trakt API, the same one every Trakt app uses, so it's bound by the API's
      conventions and rules. That's also why your history, ratings and lists stay in sync everywhere you use Trakt.
    </p>
  </div>
  <LinkButton href={traktUrls.developer} variant="violet" external>Developer portal</LinkButton>
</section>

<style>
.api {
  display: grid;
  grid-template-columns: var(--about-api-mark) minmax(0, 1fr) auto;
  gap: var(--about-api-gap);
  align-items: center;
  margin-block-start: var(--about-api-space);
  margin-block-end: var(--gutter);
  padding: var(--about-api-padding);
  border-radius: var(--about-banner-radius);
  background: linear-gradient(90deg, var(--color-about-api-tint), transparent 70%), var(--color-panel-gray);
  box-shadow: 0 0 0 1px var(--color-home-line);
}

.mark {
  inline-size: var(--about-api-mark);
  block-size: var(--about-api-mark);
}

h2 {
  margin: 0 0 var(--home-credit-gap);
  font-size: var(--font-size-h4);
}

p {
  max-inline-size: var(--about-body-width);
  margin: 0;
  line-height: var(--line-height-about-body);
  color: var(--color-home-soft);
  text-wrap: balance;

  & b {
    color: var(--color-home-text);
  }
}
</style>
