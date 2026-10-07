/** What the spirits answer when a word gets spelled out on the board. Longer words come first so they win. */
const replies: ReadonlyArray<readonly [string, string]> = [
  ['SPOILER', "We'd never. Not even from beyond."],
  ['TRAKT', 'The spirits are tracking you. They always were.'],
  ['HELLO', 'Hello from the other side.'],
  ['BINGE', 'One more episode. Then bed. (Lies.)'],
  ['WHEN', "Soon. The spirits don't do spoilers."],
  ['BOO', 'Boo yourself.'],
  ['OG', 'Back from the grave. Soon.'],
];

/** The board only keeps the last few letters; nothing it answers is longer. */
const MEMORY = 12;

interface SpellOuijaParams {
  spelled: string;
  letter: string;
}

/**
 * Adds one letter the planchette rested on. When the letters so far end in a word the spirits know, it returns their
 * reply and clears the board for the next word.
 */
export function spellOuija({ spelled, letter }: SpellOuijaParams): { spelled: string; reply: string | null } {
  const next = `${spelled}${letter.toUpperCase()}`.slice(-MEMORY);
  const match = replies.find(([word]) => next.endsWith(word));
  if (!match) return { spelled: next, reply: null };

  return { spelled: '', reply: match[1] };
}
