<!--
  Asks before making an item's art the viewer's profile cover, in the report dialog's look: the whole art that becomes
  the cover as the header, so it's easy to check, the question under it, then Cancel and Set as Cover.
    <CoverDialog bind:open={covering} item={{ type: 'show', id, title, fanart }} onset={() => (isCover = true)} />
-->
<script lang="ts">
import Dialog from '$lib/components/dialog/Dialog.svelte';
import DialogArtHeader from '$lib/components/dialog/DialogArtHeader.svelte';
import DialogForm from '$lib/components/dialog/DialogForm.svelte';
import DialogNotice from '$lib/components/dialog/DialogNotice.svelte';
import type { CardTag } from '$lib/components/media/CardTag';
import { toast } from '$lib/components/toast/toast.svelte';
import image from '$lib/icons/regular/image.svg?raw';
import { type CoverType, setCoverImage } from './coverImage.ts';
import { viewerFetch } from '../../auth/viewerFetch.ts';

interface Props {
  open: boolean;
  item: {
    readonly type: CoverType;
    readonly id: number;
    readonly title: string;
    readonly year?: number | null;
    readonly fanart?: string;
  };
  onset: () => void;
}
let { open = $bindable(), item, onset }: Props = $props();
const TYPES: Readonly<Record<CoverType, string>> = { movie: 'Movie', show: 'Show', episode: 'Episode' };
const tags = $derived<readonly CardTag[]>([
  { text: 'Cover image', icon: image },
  { text: TYPES[item.type], color: 'var(--color-dialog-art-media-tag)' },
]);
let error = $state('');
let busy = $state(false);

$effect(() => {
  if (open) error = '';
});

async function submit() {
  busy = true;
  error = '';
  const result = await setCoverImage({
    fetch: viewerFetch(),
    type: item.type,
    id: item.id,
  });
  busy = false;
  if (!result.ok) {
    error = result.message;
    toast.error(result.message);
    return;
  }
  open = false;
  onset();
  toast.success(result.message);
}
</script>

<Dialog bind:open title="Set as cover image" size="md" variant="art">
  {#snippet header(titleId)}
    <DialogArtHeader id={titleId} title={item.title} year={item.year} fanart={item.fanart} {tags} full />
  {/snippet}

  <DialogForm save={busy ? 'Saving…' : 'Set as Cover'} verb="save" {busy} onsubmit={submit}
    oncancel={() => (open = false)}>
    <p class="question">Use <b>{item.title}</b> as your profile background image?</p>
    {#if error}<DialogNotice tone="danger" role="alert">{error}</DialogNotice>{/if}
  </DialogForm>
</Dialog>

<style>
.question {
  margin: 0;
}
</style>
