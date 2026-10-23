import type { aboutSections } from './aboutSections.ts';

/** One of the about page's site sections. */
export type AboutSection = (typeof aboutSections)[number];
