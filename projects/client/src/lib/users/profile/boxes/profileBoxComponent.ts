import type { Component } from 'svelte';
import { profileBoxes } from './profileBoxes.ts';

type Entry = NonNullable<Awaited<ReturnType<(typeof profileBoxes)[number]['evaluate']>>['entry']>;

/** The component that draws a picked box's view. */
export const profileBoxComponent = (key: Entry['key']) =>
  // Each entry's key names the box its view came from, which TypeScript can't follow through the lookup.
  profileBoxes.find((box) => box.key === key)?.component as Component<{ view: Entry['view'] }> | undefined;
