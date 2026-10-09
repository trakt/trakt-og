<!--
  Asks before a show or season marks more than one episode watched, since one click on a long show adds hundreds of
  plays. `ask` opens it and resolves whether to go ahead; closing it any other way counts as no.
    <BulkWatchConfirm bind:this={confirm} />
    if (await confirm.ask({ count: 62, title: 'Breaking Bad' })) ...
-->
<script lang="ts">
import Dialog from '$lib/components/dialog/Dialog.svelte';
import PromptRow from '$lib/components/prompt/PromptRow.svelte';
import xmark from '$lib/icons/regular/xmark.svg?raw';
import check from '$lib/icons/trakt/check.svg?raw';
import { countLabel } from '$lib/utils/countLabel';

let open = $state(false);
let episodes = $state('');
let title = $state('');
let answer: ((yes: boolean) => void) | undefined;

export function ask(next: { count: number; title: string }): Promise<boolean> {
  answer?.(false);
  episodes = countLabel(next.count, 'episode');
  title = next.title;
  open = true;
  return new Promise((resolve) => (answer = resolve));
}

function reply(yes: boolean) {
  const done = answer;
  answer = undefined;
  open = false;
  done?.(yes);
}
</script>

<Dialog bind:open title="Mark {episodes} watched?" onclose={() => reply(false)}>
  <div class="body">
    <p>This adds {episodes} of <b>{title}</b> to your history.</p>
    <div class="choices">
      <PromptRow svg={check} onclick={() => reply(true)}>Yes, mark them watched</PromptRow>
      <PromptRow svg={xmark} onclick={() => reply(false)}>Cancel</PromptRow>
    </div>
  </div>
</Dialog>

<style>
.body {
  padding: 0 var(--space-dialog-inline) var(--space-dialog-inline);
}

p {
  margin: 0 0 var(--space-base-block);
}
</style>
