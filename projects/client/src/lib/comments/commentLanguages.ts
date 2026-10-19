/**
 * The comment language picker's choices: All, then the languages members write in most on Trakt this year, A to Z.
 * The code is what the API's `language` filter takes; All sends none.
 */
export const commentLanguages = [
  { code: 'all', label: 'All' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Chinese' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'id', label: 'Indonesian' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'pl', label: 'Polish' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'es', label: 'Spanish' },
  { code: 'tr', label: 'Turkish' },
] as const;

export type CommentLanguage = typeof commentLanguages[number]['code'];
