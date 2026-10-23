import { aboutSections } from '../../src/lib/about/aboutSections.ts';

interface SummaryMessagesParams {
  /** The week's counted commits as `type(scope): subject`. */
  readonly subjects: ReadonlyArray<string>;
  /** Titles of the pull requests merged that week. */
  readonly pullTitles: ReadonlyArray<string>;
}

interface ChatMessage {
  readonly role: 'system' | 'user';
  readonly content: string;
}

const SYSTEM = `You write the weekly "what's new" notes on the about page of Trakt, a site for tracking the movies and \
shows you watch. The notes describe one week of changes to the classic Trakt website.

Readers are Trakt members who don't code. Say what they can now see or do on the site, not how it was built.

Rules:
- Summarize only what the commit subjects and pull request titles say. Don't guess, and don't promise future work.
- Leave out small polish and fix commits, unless together they add up to something members will notice.
- Never mention files, components, functions, code, or developer words such as refactor, component, CSS, pixels, \
cache, token, endpoint, prop, hook, worker, lint, spec, schema, API route, Svelte, TypeScript or commit.
- Don't name any people.
- Plain, friendly English. No emoji, no exclamation marks, no marketing words.

Reply with JSON only, shaped like {"title": string, "themes": [{"section": string, "text": string}]}:
- "title": a short, episode-style name for the week, like a TV episode title, 60 characters or fewer.
- "themes": 1 to 7 themes, most noticeable first. Each "text" is one sentence of about 30 words at most.
- Each "section" is exactly one of: ${aboutSections.join(', ')}.
- A small week gets 1 or 2 themes. Don't pad.`;

const list = (items: ReadonlyArray<string>) =>
  items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- none';

/** The chat messages that ask a model for one week's summary. Only commit subjects and PR titles go in. */
export function summaryMessages({ subjects, pullTitles }: SummaryMessagesParams): ReadonlyArray<ChatMessage> {
  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: `Commits:\n${list(subjects)}\n\nMerged pull requests:\n${list(pullTitles)}` },
  ];
}
