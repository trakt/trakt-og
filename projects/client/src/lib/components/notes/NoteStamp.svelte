<!--
  A dated stamp under a note, in a box the footer buttons' size washed in its tone: the icon, the bold label, then the
  date. A note card's "Collected Sep 26, 2026", or the summary box's "Updated".
    <NoteStamp svg={collection} glyph label="Collected" date="Sep 26, 2026" tone="var(--color-note-tag-collection)" />
-->
<script lang="ts">
import Icon from '#lib/icons/Icon.svelte';

interface Props {
  svg: string;
  label: string;
  date?: string;
  /** The `<time>`'s machine date. */
  datetime?: string;
  /** A CSS color. */
  tone: string;
  /** The outline's CSS color, over the tone's. */
  line?: string;
  /** The Trakt-font icons sit high. */
  glyph?: boolean;
}

const { svg, label, date, datetime, tone, line, glyph = false }: Props = $props();
</script>

<span class="note-stamp" style:--tone={tone} style:--line={line}>
  <span class={{ glyph }}><Icon {svg} /></span>
  <strong>{label}</strong>{#if date}{#if datetime}<time {datetime}>{date}</time>{:else}<span>{date}</span>{/if}{/if}
</span>

<style>
.note-stamp {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: var(--note-activity-gap);
  min-block-size: var(--control-height);
  padding-inline: var(--glass-action-padding-card);
  border: 1px solid var(--line, color-mix(in srgb, var(--tone) var(--list-card-chip-line), transparent));
  border-radius: var(--radius-control);
  background-color: color-mix(in srgb, var(--tone) var(--list-card-chip-tint), transparent);
  color: color-mix(in srgb, var(--tone), var(--color-list-card-chip-lift) var(--list-card-chip-lift));
  font-family: var(--font-body);
  font-size: var(--font-size-glass-action);
  font-weight: normal;
  white-space: nowrap;

  & :global(.icon) {
    flex: none;
    color: var(--tone);
  }

  & strong {
    font-family: var(--font-headings);
    font-weight: var(--font-weight-headings-heavy);
  }
}

.glyph {
  display: inline-flex;
  --icon-shift: var(--quick-icon-trakt-shift);
}
</style>
