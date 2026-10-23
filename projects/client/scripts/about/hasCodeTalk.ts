const CODE_TALK = new RegExp(
  [
    'refactor\\w*',
    'components?',
    'css',
    '\\d*px',
    'cach(?:e[sd]?|ing)',
    'tokens?',
    'endpoints?',
    'props?',
    'hooks?',
    'workers?',
    'lint\\w*',
    'specs?',
    'schemas?',
    'api routes?',
    'svelte\\w*',
    'typescript',
    'commits?',
    'deps?',
    'dependenc(?:y|ies)',
    'zod',
    'vitest',
    'wrangler',
    'deno',
    'regex\\w*',
    'json',
    'sha',
  ].map((word) => `\\b${word}\\b`).join('|'),
  'i',
);

/** Whether a summary line slips into developer talk that members who don't code wouldn't follow. */
export function hasCodeTalk(text: string): boolean {
  return CODE_TALK.test(text);
}
