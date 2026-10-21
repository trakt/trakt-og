<!--
  The report dialog for items from media summaries, lists, the user options menu and comments, in the notes and list
  dialogs' art shell: the target's fanart, posters or stripes under glass with Report and type tags over its name and
  the permalink, then a reason dropdown, the reason's instructions in a notice, a message whose placeholder follows the
  reason, and Cancel and Send Report. Send stays off until the form is valid, and the footer says what's missing.
  Cmd/Ctrl+Enter sends. A server error shows in a red notice and the dialog stays open.
-->
<script lang="ts">
import { page } from '$app/state';
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { userManager } from '$lib/auth/userManager';
import ChoiceDropdown from '$lib/components/dialog/ChoiceDropdown.svelte';
import Dialog from '$lib/components/dialog/Dialog.svelte';
import DialogArtHeader from '$lib/components/dialog/DialogArtHeader.svelte';
import DialogForm from '$lib/components/dialog/DialogForm.svelte';
import DialogNotice from '$lib/components/dialog/DialogNotice.svelte';
import FieldLabel from '$lib/components/dialog/FieldLabel.svelte';
import type { CardTag } from '$lib/components/media/CardTag';
import { toast } from '$lib/components/toast/toast.svelte';
import type { ReportTarget } from '$lib/components/summary/ReportTarget';
import { reportPlaceholder } from '$lib/components/summary/reportPlaceholder';
import { reportReasons } from '$lib/components/summary/reportReasons';
import { validateReport } from '$lib/components/summary/validateReport';
import { writeMediaTool } from '$lib/components/summary/writeMediaTool';
import Icon from '$lib/icons/Icon.svelte';
import flag from '$lib/icons/solid/flag.svg?raw';
import link from '$lib/icons/solid/link.svg?raw';

interface Props {
  open: boolean;
  target: ReportTarget;
}
let { open = $bindable(), target }: Props = $props();
const id = $props.id();
const TYPES: Readonly<Record<ReportTarget['type'], string>> = {
  movie: 'Movie',
  show: 'Show',
  season: 'Season',
  episode: 'Episode',
  person: 'Person',
  user: 'User',
  comment: 'Comment',
  list: 'List',
};
const permalink = $derived(`${page.url.origin}${target.href}`);
const heading = $derived(target.title || `Report ${target.type}`);
const tags = $derived<readonly CardTag[]>([
  { text: 'Report', icon: flag },
  { text: TYPES[target.type], color: 'var(--color-dialog-art-media-tag)' },
]);
let reason = $state('');
let message = $state('');
let error = $state('');
let busy = $state(false);
const invalid = $derived(validateReport({ type: target.type, reason, message }));
const optional = $derived(!invalid.reason && !validateReport({ type: target.type, reason, message: '' }).message);
const missing = $derived(
  invalid.reason ? 'Pick a reason to send' : invalid.message ? 'Add a message to send' : undefined,
);
const instructions = $derived(
  target.type === 'comment'
    ? ['spoilers', 'duplicate', 'other'].includes(reason)
    : (target.type !== 'user' || reason === 'other') &&
      ['metadata', 'duplicate', 'remove', 'data_refresh', 'runtime', 'tmdb', 'other', 'adult'].includes(reason),
);
const tmdb = $derived(target.tmdb ?? 'https://www.themoviedb.org');

$effect(() => {
  if (!open) return;
  reason = '';
  message = '';
  error = '';
});

// Keep the permalink in the tab order, but start a report at its reason.
const focusReason = (field: HTMLElement) => {
  if (!open) return;
  queueMicrotask(() => {
    if (open) field.querySelector('button')?.focus();
  });
};

async function submit() {
  busy = true;
  error = '';
  const result = await writeMediaTool({
    fetch: authenticatedFetch({ manager: userManager() }),
    action: { kind: 'report', target, reason, message },
  });
  busy = false;
  if (!result.ok) {
    error = result.message;
    // OG's comment modal only shows it inline.
    if (target.type !== 'comment') toast.error(result.message);
    return;
  }
  open = false;
  toast.success(result.message);
}
</script>

<!-- External/permalink links aren't typed SvelteKit routes. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<Dialog bind:open title={heading} size="md" variant="art">
  {#snippet header(titleId)}
    <DialogArtHeader id={titleId} title={heading} year={target.year} fanart={target.fanart} posters={target.posters}
      {tags}>
      <a class="permalink" href={permalink} target="_blank" rel="noopener"><Icon svg={link} /><span>{permalink}</span></a>
    </DialogArtHeader>
  {/snippet}

  <DialogForm save={busy ? 'Sending…' : 'Send Report'} verb="send" hint={missing} {busy} disabled={Boolean(missing)}
    onsubmit={submit} oncancel={() => (open = false)}>
    <div {@attach focusReason}>
      <ChoiceDropdown label="Reason" options={reportReasons(target.type)} bind:value={reason} placeholder="Choose a reason"
        disabled={busy} />
    </div>
    {#if instructions}
      <DialogNotice role="status">
        {#if reason === 'spoilers'}
          If you've already seen this item, spoilers won't be hidden.
        {:else if reason === 'duplicate' && target.type === 'comment'}
          Please include Trakt links for the original comment and all duplicates.
        {:else if reason === 'metadata'}
          Please update <a href={tmdb} target="_blank" rel="noopener">TMDB</a> before reporting this item. Trakt will automatically refresh about <b>24 hours</b> after <a href={tmdb} target="_blank" rel="noopener">TMDB</a> is updated.
        {:else if reason === 'duplicate'}
          Please report the duplicate item only <em>(not the correct item)</em> and include the Trakt link to the correct item.
        {:else if reason === 'remove'}
          Please check for duplicates first. Sometimes we actually need to merge duplicates and not simply remove the item. Please make sure the item has been removed from <a href={tmdb} target="_blank" rel="noopener">TMDB</a> before reporting it.
        {:else if reason === 'data_refresh'}
          Please update <a href={tmdb} target="_blank" rel="noopener">TMDB</a> before reporting this item. If the item hasn't been updated in 24 hours, we'll automatically queue it for a refresh.
        {:else if reason === 'runtime'}
          Please update <a href={tmdb} target="_blank" rel="noopener">TMDB</a> with the correct runtime before reporting this item. Trakt will auto refresh and grab the updated runtime.
        {:else if reason === 'tmdb'}
          Please make sure <a href={tmdb} target="_blank" rel="noopener">TMDB</a> is updated and the TMDB comparison page indicates we're ready to migrate.
        {:else if reason === 'adult'}
          Please make sure <a href={tmdb} target="_blank" rel="noopener">TMDB</a> has this item marked as <em>adult</em> before reporting it.
        {:else}
          If possible, please select a built in reason. If not, please be as detailed as you can.
        {/if}
      </DialogNotice>
    {/if}
    <div>
      <FieldLabel text="Message" for="{id}-message">
        {#snippet aside()}{#if optional}<span class="optional">Optional</span>{/if}{/snippet}
      </FieldLabel>
      <textarea id="{id}-message" bind:value={message} rows="4" placeholder={reportPlaceholder(target.type, reason)}
        disabled={busy}></textarea>
    </div>
    {#if error}<DialogNotice tone="danger" role="alert">{error}</DialogNotice>{/if}
  </DialogForm>
</Dialog>

<style>
.permalink {
  display: flex;
  align-items: center;
  gap: var(--dialog-art-link-gap);
  min-inline-size: 0;
  color: var(--color-dialog-art-link);
  font-size: var(--font-size-dialog-art-link);
  text-decoration: none;

  & span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:is(:hover, :focus-visible) {
    color: var(--color-card-text);
    text-decoration: underline;
  }
}

.optional {
  font-weight: normal;
  letter-spacing: normal;
  text-transform: none;
}
</style>
