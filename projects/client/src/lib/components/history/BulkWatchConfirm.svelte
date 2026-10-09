<!--
  Asks before a show or season marks more than one episode watched, since one click on a long show adds hundreds of
  plays. `ask` opens it and resolves whether to go ahead; closing it any other way counts as no.
    <BulkWatchConfirm bind:this={confirm} />
    if (await confirm.ask({ count: 62, title: 'Breaking Bad' })) ...
-->
<script lang="ts">
import Dialog from '$lib/components/dialog/Dialog.svelte';
import Icon from '$lib/icons/Icon.svelte';
import check from '$lib/icons/trakt/check-thick.svg?raw';
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
  <p class="message">This adds <b>{episodes}</b> of <b>{title}</b> to your watched history.</p>
  <button type="button" class="confirm" onclick={() => reply(true)}><Icon svg={check} /> Mark watched</button>
  <button type="button" class="cancel" onclick={() => reply(false)}>Cancel</button>
</Dialog>

<style>
.message {
  margin: 0;
  color: var(--color-text);
  line-height: var(--line-height-base);
}

/* The notes modal's full-width submit, in the watched purple. */
.confirm {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm-inline);
  inline-size: 100%;
  margin-block-start: var(--gutter);
  padding: var(--space-lg-block) var(--space-lg-inline);
  border-color: var(--brand-tertiary);
  background-color: var(--brand-tertiary);
  color: var(--color-text-inverse);
  font-family: var(--font-headings);
  font-size: var(--font-size-dialog-submit);
  font-weight: var(--font-weight-headings-heavy);
  text-transform: uppercase;

  &:is(:hover, :focus-visible) {
    border-color: var(--brand-tertiary-darken);
    background-color: var(--brand-tertiary-darken);
  }
}

.cancel {
  display: block;
  margin: var(--space-base-block) auto 0;
  padding: var(--space-sm-block) var(--space-base-inline);
  border: 0;
  background: none;
  color: var(--color-text-muted);
  font: inherit;

  &:is(:hover, :focus-visible) {
    color: var(--color-text);
    text-decoration: underline;
  }
}
</style>
