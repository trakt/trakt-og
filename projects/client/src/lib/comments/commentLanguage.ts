import { type CommentLanguage, commentLanguages } from './commentLanguages.ts';

const DEFAULT: CommentLanguage = 'en';

const isLanguage = (value: string): value is CommentLanguage => commentLanguages.some(({ code }) => code === value);

/**
 * The `?language=` a comment list was asked for, English by default or when it isn't one of the choices, with the
 * API's filter for it (none for All) and the query to put back on a link (none for English).
 */
export function commentLanguage(param: string | null | undefined) {
  const code = param && isLanguage(param) ? param : DEFAULT;
  return {
    code,
    label: commentLanguages.find((language) => language.code === code)?.label ?? code,
    api: code === 'all' ? undefined : code,
    search: code === DEFAULT ? '' : `language=${code}`,
  } as const;
}
