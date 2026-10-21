<!--
  OG's magnific-popup video: a YouTube player centered over a dark page, closed with the × above it, Esc or a click
  on the backdrop. Every video lightbox uses it: the summary trailer tile and YouTube links in comments.
  A native modal <dialog> that takes focus itself, not the ×, and gives it back to the link that opened it.
    <VideoPopup bind:url title="Fight Club (1999) trailer" />
  Set `url` to a YouTube link to open it. Closing sets it back to `undefined`. Open it only for a plain click
  (`isPlainClick`) on a link `youtubeEmbedUrl` can embed, so a middle or modified click still opens YouTube.
-->
<script lang="ts">
import { youtubeEmbedUrl } from './youtubeEmbedUrl.ts';

interface Props {
  /** A YouTube link. `undefined` closes the popup. */
  url: string | undefined;
  /** Names the dialog and the player. */
  title?: string;
}

let { url = $bindable(), title = 'YouTube video' }: Props = $props();

const embed = $derived(url ? youtubeEmbedUrl(url) : undefined);

// Reads `embed`, so it re-runs whenever the link changes. Opening moves focus to the ×, so the dialog takes it back
// before anything paints; Tab still reaches the ×.
const syncOpen = (dialog: HTMLDialogElement) => {
  if (embed && !dialog.open) {
    dialog.showModal();
    dialog.focus();
  }
  if (!embed && dialog.open) dialog.close();
};

// Closes the dialog itself, so focus goes back even when the caller unmounts the popup once `url` clears.
const close = (event: MouseEvent & { currentTarget: HTMLButtonElement }) =>
  event.currentTarget.closest('dialog')?.close();
</script>

<dialog class="video-popup" aria-label={title} closedby="any" tabindex="-1" onclose={() => (url = undefined)}
  {@attach syncOpen}>
  <button type="button" class="close" title="Close (Esc)" aria-label="Close" onclick={close}>
    <span aria-hidden="true">×</span>
  </button>
  {#if embed}
    <!-- YouTube refuses an embed with no referrer (its error 153), and the app sends none off-site: this sends it the
         origin only, never the page. -->
    <iframe src={embed} {title} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin">
    </iframe>
  {/if}
</dialog>

<style>
.video-popup {
  --gutter: var(--space-lightbox-gutter);
  inline-size: min(var(--lightbox-width), 100% - 2 * var(--gutter));
  max-inline-size: none;
  max-block-size: none;
  padding: 0;
  overflow: visible;
  border: 0;
  background: var(--color-lightbox-bg);
  box-shadow: var(--shadow-lightbox);

  &::backdrop {
    background-color: var(--color-lightbox-backdrop);
  }

  /* The dialog holds focus only as a starting point; the player and the × show their own. */
  &:focus {
    outline: none;
  }

  @media (width < 800px) {
    --gutter: var(--space-lightbox-gutter-mobile);
  }
}

iframe {
  display: block;
  inline-size: 100%;
  aspect-ratio: var(--ratio-fanart);
  border: 0;
}

.close {
  position: absolute;
  inset-block-start: calc(-1 * var(--lightbox-close-top));
  inset-inline-end: calc(-1 * var(--lightbox-close-overhang));
  inline-size: var(--lightbox-close-size);
  min-block-size: 0;
  block-size: var(--lightbox-close-size);
  padding: 0 var(--lightbox-close-overhang) 0 0;
  border: 0;
  background: none;
  color: var(--color-lightbox-close);
  font-family: var(--font-lightbox-close);
  font-size: var(--font-size-lightbox-close);
  line-height: var(--lightbox-close-size);
  text-align: end;
  opacity: var(--opacity-lightbox-close);

  &:hover,
  &:focus-visible {
    opacity: 1;
  }

  &:active {
    translate: 0 1px;
  }
}
</style>
