export interface SpiritReply {
  /** The word the spirits spell back on the board by themselves. */
  answer: string;
  /** What they mean by it. */
  text: string;
}

/** What the spirits answer when a word gets spelled out on the board. Longer words come first so they win. */
const replies: ReadonlyArray<readonly [string, SpiritReply]> = [
  ['SPOILER', { answer: 'NEVER', text: "We'd never. Not even from beyond." }],
  ['TRAKT', { answer: 'WATCHING', text: 'The spirits are tracking you. They always were.' }],
  ['HELLO', { answer: 'HI', text: 'Hello from the other side.' }],
  ['BINGE', { answer: 'MORE', text: 'One more episode. Then bed. (Lies.)' }],
  ['WHEN', { answer: 'SOON', text: "Soon. The spirits don't do spoilers." }],
  ['BOO', { answer: 'BOO', text: 'Boo yourself.' }],
  ['OG', { answer: 'RISEN', text: 'Back from the grave. Soon.' }],
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
export function spellOuija({ spelled, letter }: SpellOuijaParams): { spelled: string; reply: SpiritReply | null } {
  const next = `${spelled}${letter.toUpperCase()}`.slice(-MEMORY);
  const match = replies.find(([word]) => next.endsWith(word));
  if (!match) return { spelled: next, reply: null };

  return { spelled: '', reply: match[1] };
}
