<!--
  The comment composer, shared by the new comment form, the reply box and the edit form: a rounded field with the
  formatting toolbar, the word meter, the "Spoilers" switch, Cancel and the submit button under it.
  It opens focused with the cursor at the end. Cmd/Ctrl+Enter submits, and a failure toasts the API's message and
  refocuses the field. `confirmLeave` asks before leaving the page or cancelling with text that hasn't been posted.
    <CommentComposer label="Your reply" placeholder="Reply to Sean..." submit="Reply" posting="Posting your reply"
      avatar={avatar} small oncancel={close} save={(text) => client.reply(id, text)} onsaved={replied} />
-->
<script lang="ts">
import { beforeNavigate } from '$app/navigation';
import type { CommentResponse } from '@trakt/api';
import { tick } from 'svelte';
import { toast } from '../toast/toast.svelte.ts';
import CommentAvatar from './CommentAvatar.svelte';
import CommentSubmit from './CommentSubmit.svelte';
import CommentToolbar from './CommentToolbar.svelte';
import { type CommentFormat, formatSelection } from './formatSelection.ts';
import type { PostCommentResult } from './postComment.ts';
import SpoilerSwitch from './SpoilerSwitch.svelte';
import { submitShortcut } from './submitShortcut.ts';
import WordMeter from './WordMeter.svelte';
import { wordCount } from './wordCount.ts';

// The API turns down a comment or a reply under 5 words, unless it's a review.
const MIN_WORDS = 5;
const UNSAVED = "Your comment hasn't been posted yet! If you leave this page, you'll lose what you wrote.";
const DISCARD = "Your comment hasn't been posted yet! Discard what you wrote?";

interface Props {
  /** What the field starts with: "@author " for a reply, the raw text for an edit. */
  text?: string;
  label: string;
  placeholder: string;
  /** The submit button: "Post", "Reply" or "Save". */
  submit: string;
  /** What its spinner says. */
  posting: string;
  /** The viewer's avatar, beside the field. */
  avatar?: string;
  /** The smaller avatar of a reply on the thread's rail. */
  small?: boolean;
  /** The line of rules over the toolbar. */
  rules?: string;
  /** The "Spoilers" switch, set to this. Left out, there's no switch. */
  spoiler?: boolean;
  /** The word minimum; 0 leaves the meter out, as for editing a review. */
  minWords?: number;
  /** Asks before leaving the page, or cancelling, with text that hasn't been posted. */
  confirmLeave?: boolean;
  /** A Cancel button. */
  oncancel?: () => void;
  save: (text: string, spoiler: boolean) => Promise<PostCommentResult>;
  /** The saved comment (null when its body was off-contract), with what was sent. */
  onsaved: (comment: CommentResponse | null, text: string, spoiler: boolean) => void;
}

const {
  text: initial = '',
  label,
  placeholder,
  submit: submitText,
  posting: postingLabel,
  avatar,
  small = false,
  rules,
  spoiler: initialSpoiler,
  minWords = MIN_WORDS,
  confirmLeave = false,
  oncancel,
  save,
  onsaved,
}: Props = $props();

const id = $props.id();
// Seeded once: a reply box or an edit form is created each time it opens.
// svelte-ignore state_referenced_locally
let text = $state(initial);
// svelte-ignore state_referenced_locally
let spoiler = $state(initialSpoiler ?? false);
let posting = $state(false);
let textarea = $state<HTMLTextAreaElement>();
const words = $derived(wordCount(text));
const describedBy = $derived(
  [rules ? `${id}-rules` : '', minWords > 0 ? `${id}-meter` : ''].filter(Boolean).join(' ') || undefined,
);

/** Moves the focus into the field, for "Add comment". */
export function focus() {
  textarea?.focus({ preventScroll: true });
}

const focusAtEnd = (element: HTMLTextAreaElement) => {
  element.focus();
  element.setSelectionRange(element.value.length, element.value.length);
};

beforeNavigate((navigation) => {
  if (!confirmLeave || !text.trim() || posting) return;
  if (navigation.to?.url.pathname === location.pathname && navigation.to.url.search === location.search) return;
  // A reload or another site gets the browser's own prompt.
  if (navigation.willUnload) return navigation.cancel();
  if (confirm(UNSAVED)) return;
  navigation.cancel();
  textarea?.focus();
});

// Text that hasn't been posted is only thrown away once the member says so.
function cancel() {
  if (confirmLeave && text.trim() && !confirm(DISCARD)) {
    textarea?.focus();
    return;
  }
  oncancel?.();
}

async function format(kind: CommentFormat) {
  if (!textarea) return;
  const next = formatSelection({ text, start: textarea.selectionStart, end: textarea.selectionEnd }, kind);
  text = next.text;
  await tick();
  textarea?.focus();
  textarea?.setSelectionRange(next.start, next.end);
}

async function send(event: SubmitEvent) {
  event.preventDefault();
  if (posting) return;
  posting = true;
  const sent = text.trim();
  const flagged = spoiler;
  const result = await save(sent, flagged);
  posting = false;
  if (!result.ok) {
    toast.error(result.message);
    textarea?.focus();
    return;
  }
  onsaved(result.comment, sent, flagged);
}
</script>

<form class={['composer', { small, 'with-avatar': avatar !== undefined }]} onsubmit={send}>
  {#if avatar !== undefined}<span class="avatar"><CommentAvatar src={avatar} {small} /></span>{/if}
  <div class="field">
    <textarea
      bind:this={textarea}
      bind:value={text}
      rows="1"
      {placeholder}
      aria-label={label}
      aria-describedby={describedBy}
      onkeydown={submitShortcut}
      {@attach focusAtEnd}
    ></textarea>
    <div class="footer">
      {#if rules}<p class="rules" id="{id}-rules">{rules}</p>{/if}
      <CommentToolbar onformat={format} />
      {#if minWords > 0}<WordMeter id="{id}-meter" {words} min={minWords} />{/if}
      {#if initialSpoiler !== undefined}<SpoilerSwitch bind:spoiler />{/if}
      {#if oncancel}<button type="button" class="cancel" onclick={cancel}>Cancel</button>{/if}
      <CommentSubmit {posting} text={submitText} label={postingLabel} />
    </div>
  </div>
</form>

<style>
.composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  column-gap: var(--comment-column-gap);
}

.with-avatar {
  grid-template-columns: var(--comment-avatar) minmax(0, 1fr);

  &.small {
    grid-template-columns: var(--comment-avatar-nested) minmax(0, 1fr);
    column-gap: var(--comment-column-gap-nested);
  }
}

.field {
  min-inline-size: 0;
  border: 1px solid var(--color-comment-field-border);
  border-radius: var(--radius-comment-field);
  background-color: var(--color-comment-bg);
  transition: border-color var(--transition-comment-quiet);

  &:focus-within {
    border-color: var(--color-input-border-focus);
  }
}

textarea {
  display: block;
  inline-size: 100%;
  min-block-size: var(--comment-field-height);
  padding: var(--comment-field-padding);
  border: 0;
  border-radius: inherit;
  background: transparent;
  box-shadow: none;
  color: var(--color-text);
  font-family: var(--font-body);
  resize: none;
  field-sizing: content;

  /* The field's border shows the focus. */
  &:focus {
    outline: 0;
    box-shadow: none;
  }

  &::placeholder {
    color: var(--color-comment-muted);
  }
}

.footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--comment-composer-footer-gap);
  padding: var(--comment-composer-footer-padding);
}

.rules {
  flex-basis: 100%;
  margin: 0;
  padding-inline-start: var(--comment-composer-rules-inset);
  color: var(--color-comment-muted);
  font-size: var(--font-size-small);
}

.cancel {
  min-block-size: var(--comment-submit-height);
  padding: var(--comment-cancel-padding);
  border: 0;
  background: none;
  color: var(--color-comment-muted);
  font-size: var(--font-size-comment-meta);
  font-weight: var(--font-weight-headings);

  &:hover {
    color: var(--color-text);
  }
}

@media (prefers-reduced-motion: reduce) {
  .field {
    transition: none;
  }
}
</style>
