import { type StartMarks, startMarks } from './gettingStarted.ts';

let marks = $state<Record<string, StartMarks>>({});

/**
 * The getting-started marks (hidden, apps opened) kept live on the page, so the header's book and the profile's
 * credits agree the moment either changes them. Reads fall back to this browser's saved copy.
 */
export const liveMarks = {
  get(slug: string): StartMarks {
    return marks[slug] ?? startMarks.read(slug);
  },
  mark(slug: string, next: StartMarks) {
    const merged = { ...liveMarks.get(slug), ...next };
    marks = { ...marks, [slug]: merged };
    startMarks.write(slug, merged);
  },
};
