// CJK scripts don't space their words, so each character counts as one, like the server.
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;
// An emoji counts as one word, like the Worker's count.
const EMOJI = /\p{RGI_Emoji}/gv;
// A tagged member isn't part of what's said: "@v-ctor-palmero-rodr-guez-7d027e" alone is no words, not six.
const MENTION = /(^|\s)@[\p{L}\p{N}_.-]+/gu;

/** The word count for the 5-word minimum: the API's, less any tagged members. */
export function wordCount(text: string): number {
  return text
    .replace(MENTION, '$1')
    .replace(EMOJI, ' e ')
    .replace(CJK, ' $& ')
    .match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
}
