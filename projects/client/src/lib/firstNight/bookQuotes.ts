/** A film or TV line about getting started or getting to work, and whose it is. */
export type BookQuote = { readonly quote: string; readonly from: string };

const FIRST: BookQuote = { quote: 'Hold on to your butts.', from: 'Jurassic Park' };

/** The getting-started book's titles, one picked at random each time it opens on a page. */
export const bookQuotes: readonly BookQuote[] = [
  FIRST,
  { quote: "Let's get down to business.", from: 'Mulan' },
  { quote: 'Just keep swimming.', from: 'Finding Nemo' },
  { quote: 'To infinity and beyond!', from: 'Toy Story' },
  { quote: 'Engage.', from: 'Star Trek: The Next Generation' },
  { quote: 'Allons-y!', from: 'Doctor Who' },
  { quote: 'Life moves pretty fast.', from: "Ferris Bueller's Day Off" },
  { quote: 'Carpe diem. Seize the day.', from: 'Dead Poets Society' },
  { quote: "Let's go to work.", from: 'Reservoir Dogs' },
  { quote: "It's showtime!", from: 'Beetlejuice' },
  { quote: "Clear eyes, full hearts, can't lose.", from: 'Friday Night Lights' },
  { quote: 'May the Force be with you.', from: 'Star Wars' },
  { quote: "We're on a mission from God.", from: 'The Blues Brothers' },
  { quote: "Let's light this candle.", from: 'The Right Stuff' },
  { quote: 'Wax on, wax off.', from: 'The Karate Kid' },
  { quote: 'Do. Or do not. There is no try.', from: 'The Empire Strikes Back' },
  { quote: 'Everything is awesome!', from: 'The LEGO Movie' },
  { quote: 'Welcome to the party, pal!', from: 'Die Hard' },
  { quote: "There's no place like home.", from: 'The Wizard of Oz' },
  { quote: 'Make it so.', from: 'Star Trek: The Next Generation' },
];

/** One of the lines, at random. */
export const pickBookQuote = (random: () => number = Math.random): BookQuote =>
  bookQuotes[Math.floor(random() * bookQuotes.length)] ?? FIRST;
