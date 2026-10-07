/** The API's media filters for one type. A comma means "any of"; a leading minus excludes. */
export type ThemeFilter = {
  readonly genres?: string;
  readonly subgenres?: string;
  readonly ratings?: string;
  readonly runtimes?: string;
};

/** One slot in discover's month map: a month's theme, or a short event that takes over for a few days. */
export type DiscoverTheme = {
  readonly id: string;
  readonly title: string;
  /** The hero's subtitle. */
  readonly blurb: string;
  /** `MM-DD`, inclusive. An end before the start wraps into the next year. */
  readonly start: string;
  readonly end: string;
  readonly movie: ThemeFilter;
  /** Left out when shows don't fit the theme; the slot fills with movies. */
  readonly show?: ThemeFilter;
  /** The search term for the season's community lists. */
  readonly listQuery: string;
  /** Events win over the month they fall in. */
  readonly event?: boolean;
};

/**
 * Discover's month map. Every month has a theme, and a few events take over for some days. Each theme fills the
 * season hero and its shelf from what's trending now, then the all-time favorites, so a month out of season still has picks. The
 * filters were checked against the API on 2026-10-07: each returns 20 or more favorites per type.
 */
export const DISCOVER_THEMES: readonly DiscoverTheme[] = [
  {
    id: 'snowed-in',
    title: 'Snowed In',
    blurb: 'Blizzards, whiteouts and cabins cut off from the world. Stay in with something chilling.',
    start: '01-02',
    end: '01-31',
    movie: { subgenres: 'winter,snow,mountain,mount-everest,isolation', genres: '-animation,-family,-fantasy' },
    show: { subgenres: 'winter,snow,isolation,wilderness', genres: '-anime' },
    listQuery: 'winter',
  },
  {
    id: 'love-month',
    title: 'Love Month',
    blurb: 'Meet-cutes, slow burns and enemies who end up more. Something for every kind of crush.',
    start: '02-01',
    end: '02-29',
    movie: {
      genres: 'romance',
      subgenres: 'romcom,falling-in-love,first-love,enemies-to-lovers,friends-to-lovers,star-crossed-lovers',
    },
    show: { genres: 'romance', subgenres: 'romcom,falling-in-love,enemies-to-lovers,friends-to-lovers,teen-romance' },
    listQuery: 'romance',
  },
  {
    id: 'game-on',
    title: 'Game On',
    blurb: 'Underdogs, rivalries and last-second wins, all through March Madness.',
    start: '03-01',
    end: '03-31',
    movie: {
      subgenres: 'sports,basketball,american-football,football-soccer,sport-competition,wrestling',
      genres: '-fantasy,-science-fiction,-animation',
    },
    show: { subgenres: 'sports,sports-documentary,basketball,football-soccer,sport-competition', genres: '-crime' },
    listQuery: 'sports',
  },
  {
    id: 'mind-benders',
    title: 'Mind-Benders',
    blurb: 'Time loops, other worlds and twists you’ll want to rewatch the moment they end.',
    start: '04-01',
    end: '04-30',
    movie: {
      subgenres: 'time-travel,alternate-dimension,butterfly-effect,surreal,psychological-thriller,virtual-reality',
      genres: '-superhero,-animation,-family,-fantasy',
    },
    show: {
      subgenres: 'time-travel,alternate-dimension,surreal,psychological-thriller',
      genres: '-animation,-superhero',
    },
    listQuery: 'mindfuck',
  },
  {
    id: 'space-month',
    title: 'Space Month',
    blurb: 'Space operas, lone astronauts and first contact, light-years from home.',
    start: '05-05',
    end: '05-31',
    movie: { subgenres: 'space-opera,space,space-travel,spacecraft,astronaut', genres: '-superhero' },
    show: { subgenres: 'space-opera,space,space-travel,spacecraft', genres: '-animation' },
    listQuery: 'space',
  },
  {
    id: 'pride',
    title: 'Pride',
    blurb: 'Coming out, falling in love and drag at its fiercest. Queer stories, all month long.',
    start: '06-01',
    end: '06-30',
    movie: { subgenres: 'lesbian,lesbian-relationship,lgbt-teen,drag,drag-queen,exploring-sexuality' },
    show: {
      subgenres: 'lesbian,lesbian-relationship,lgbt-teen,drag,drag-queen,drag-queen-competition,exploring-sexuality',
      genres: '-animation',
    },
    listQuery: 'lgbt',
  },
  {
    id: 'summer-trip',
    title: 'Summer Trip',
    blurb: 'Beaches, road trips and summers at camp, for long, warm nights.',
    start: '07-01',
    end: '07-31',
    movie: {
      subgenres: 'summer,beach,vacation,road-trip,summer-camp,family-vacation',
      genres: '-horror,-war,-fantasy,-superhero',
    },
    show: { subgenres: 'summer,beach,vacation,road-trip,travel', genres: '-anime,-crime' },
    listQuery: 'summer',
  },
  {
    id: 'back-to-school',
    title: 'Back to School',
    blurb: 'Lockers, dorm rooms and growing up the hard way.',
    start: '08-01',
    end: '08-31',
    movie: {
      subgenres: 'high-school,college,coming-of-age,teen-drama,university',
      genres: '-fantasy,-animation,-superhero',
    },
    show: { subgenres: 'high-school,college,coming-of-age,teen-drama,university', genres: '-anime,-animation' },
    listQuery: 'high school',
  },
  {
    id: 'case-files',
    title: 'Case Files',
    blurb: 'Whodunits, detectives and true crime, as the nights get longer.',
    start: '09-01',
    end: '09-30',
    movie: { subgenres: 'whodunit,murder-mystery,detective,private-detective,cold-case', genres: 'mystery,crime' },
    show: {
      subgenres: 'whodunit,murder-mystery,detective,private-detective,cold-case,true-crime',
      genres: 'mystery,crime,documentary',
    },
    listQuery: 'mystery',
  },
  {
    id: 'halloween',
    title: '31 Nights of Horror',
    blurb: 'Hauntings, slashers, witches and monsters. One for every night until Halloween.',
    start: '10-01',
    end: '10-31',
    movie: {
      genres: 'horror',
      subgenres:
        'halloween,haunting,haunted-house,slasher,witch,demon,occult,supernatural-horror,zombie,vampire,werewolf',
    },
    show: { genres: 'horror', subgenres: 'halloween,haunting,nightmare,witch,monster,demon,occult,supernatural' },
    listQuery: 'horror',
  },
  {
    id: 'comfort-food',
    title: 'Comfort Food',
    blurb: 'Kitchens, bakeries and family dinners that go sideways. Feel-good food, served warm.',
    start: '11-01',
    end: '11-30',
    movie: {
      subgenres: 'thanksgiving,food,cooking,chef,restaurant,culinary-arts,baker',
      genres: '-horror,-science-fiction,-action',
    },
    show: { subgenres: 'cooking,cooking-competition,baking,baking-competition,food,culinary-arts,chef,restaurant' },
    listQuery: 'food',
  },
  {
    id: 'holidays',
    title: 'The Holidays',
    blurb: 'Christmas classics, snowy romances and Santa on a deadline.',
    start: '12-01',
    end: '12-30',
    movie: {
      subgenres: 'christmas,christmas-eve,santa-claus,xmas-eve,christmas-romance,holiday-season,hallmark-movie',
    },
    show: { subgenres: 'christmas,christmas-eve,santa-claus,holiday-season,christmas-romance' },
    listQuery: 'christmas',
  },
  {
    id: 'new-year',
    title: 'New Year’s Eve',
    blurb: 'Countdowns, parties and one last midnight kiss before the year turns.',
    start: '12-31',
    end: '01-01',
    event: true,
    movie: { subgenres: 'new-year-s-eve', genres: 'comedy,romance,holiday' },
    listQuery: 'new year',
  },
  {
    id: 'valentines',
    title: 'Valentine’s Week',
    blurb: 'Date-night picks for two, and a few for watching solo.',
    start: '02-10',
    end: '02-14',
    event: true,
    movie: { genres: 'romance', subgenres: 'romcom,blind-date,dating,first-love' },
    show: { genres: 'romance', subgenres: 'dating,dating-show,romcom' },
    listQuery: 'valentine',
  },
  {
    id: 'oscars',
    title: 'Oscars Week',
    blurb: 'The most acclaimed films around, for the week of the Academy Awards.',
    start: '03-08',
    end: '03-15',
    event: true,
    movie: { ratings: '80-100', genres: 'drama,history,war,music' },
    listQuery: 'oscar',
  },
  {
    id: 'may-fourth',
    title: 'May the Fourth',
    blurb: 'A galaxy far, far away, and the space operas it inspired.',
    start: '05-01',
    end: '05-04',
    event: true,
    movie: { subgenres: 'space-opera' },
    show: { subgenres: 'space-opera' },
    listQuery: 'star wars',
  },
  {
    id: 'thanksgiving',
    title: 'Thanksgiving',
    blurb: 'Turkey, travel chaos and family fights at the table.',
    start: '11-22',
    end: '11-28',
    event: true,
    movie: { subgenres: 'thanksgiving' },
    show: { subgenres: 'cooking,baking-competition,thanksgiving' },
    listQuery: 'thanksgiving',
  },
];
