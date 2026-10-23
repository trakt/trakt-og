import archive from '$lib/icons/solid/box-archive.svg?raw';
import backward from '$lib/icons/solid/backward.svg?raw';
import broom from '$lib/icons/solid/broom.svg?raw';
import bug from '$lib/icons/solid/bug.svg?raw';
import code from '$lib/icons/solid/code.svg?raw';
import flask from '$lib/icons/solid/flask.svg?raw';
import gear from '$lib/icons/solid/gear.svg?raw';
import highlighter from '$lib/icons/solid/highlighter.svg?raw';
import memo from '$lib/icons/solid/memo.svg?raw';
import paintbrush from '$lib/icons/solid/paintbrush.svg?raw';
import arrowsRotate from '$lib/icons/solid/arrows-rotate.svg?raw';
import rocket from '$lib/icons/solid/rocket.svg?raw';
import sparkles from '$lib/icons/solid/sparkles.svg?raw';

/** A commit type's tile: a solid icon on its color, and the word a screen reader hears. */
export type CommitTypeTile = { readonly label: string; readonly icon: string; readonly color: string };

/** One per type commitlint allows, each in a brand color, so a glance down the feed says what kind of change it was. */
const TILES: Readonly<Record<string, CommitTypeTile>> = {
  feat: { label: 'New', icon: sparkles, color: 'var(--brand-primary)' },
  fix: { label: 'Fixed', icon: bug, color: 'var(--brand-seventh)' },
  perf: { label: 'Faster', icon: rocket, color: 'var(--episode-series-premiere)' },
  refactor: { label: 'Reworked', icon: arrowsRotate, color: 'var(--brand-fifth)' },
  design: { label: 'Design', icon: paintbrush, color: 'var(--brand-tertiary)' },
  style: { label: 'Style', icon: highlighter, color: 'var(--brand-eighth)' },
  docs: { label: 'Docs', icon: memo, color: 'var(--brand-secondary)' },
  test: { label: 'Tests', icon: flask, color: 'var(--brand-quaternary)' },
  ci: { label: 'CI', icon: gear, color: 'var(--brand-sixth)' },
  build: { label: 'Build', icon: archive, color: 'var(--brand-sixth)' },
  chore: { label: 'Chore', icon: broom, color: 'var(--brand-sixth)' },
  revert: { label: 'Reverted', icon: backward, color: 'var(--brand-danger)' },
};

const OTHER: CommitTypeTile = { label: 'Change', icon: code, color: 'var(--brand-sixth)' };

/** The tile for a commit's conventional type; anything else gets a plain code tile. */
export function commitTypeTile(type: string | null): CommitTypeTile {
  return (type && TILES[type]) || OTHER;
}
