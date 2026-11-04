/** The taste match levels a scene plays for, v3's ladder top to bottom. */
export type SceneLevel = 'soulmates' | 'co-stars' | 'crossover' | 'spin-off' | 'cameo' | 'different-universe';

export type FighterPose = 'stand' | 'walk' | 'step' | 'hold' | 'raise' | 'wave' | 'wave2' | 'front' | 'bow';

/** One of the two fighters: px across from the header's middle and down from the floor, and how long a move takes. */
export interface Fighter {
  x: number;
  y: number;
  pose: FighterPose;
  /** 1 faces right, -1 left. */
  face: 1 | -1;
  shown: boolean;
  glide: number;
  sway: boolean;
}

/** Everything a scene can show over the header. */
export interface Scene {
  you: Fighter;
  them: Fighter;
  saucer: { x: number; shown: boolean; glide: number };
  beam: boolean;
  heart: boolean;
  questions: boolean;
  spotlight: boolean;
  confetti: boolean;
  /** Sparks where two hands meet: px across from the middle and up from the floor. */
  burst: { x: number; y: number } | null;
  banner: string | null;
}

export interface SceneScript {
  start: () => Scene;
  /** Moments in ms from the start, each changing the scene. */
  beats: readonly (readonly [number, (scene: Scene) => void])[];
  /** When it starts to fade out. */
  leaveAt: number;
}

const OFF = 440;

const fighter = (x: number, face: 1 | -1, extra: Partial<Fighter> = {}): Fighter => ({
  x,
  y: 0,
  pose: 'walk',
  face,
  shown: true,
  glide: 0,
  sway: false,
  ...extra,
});

const scene = (you: Fighter, them: Fighter): Scene => ({
  you,
  them,
  saucer: { x: OFF + 80, shown: false, glide: 0 },
  beam: false,
  heart: false,
  questions: false,
  spotlight: false,
  confetti: false,
  burst: null,
  banner: null,
});

const go = (who: Fighter, x: number, glide: number, pose: FighterPose = 'walk') => {
  who.x = x;
  who.glide = glide;
  who.pose = pose;
};

const both = (s: Scene, pose: FighterPose) => {
  s.you.pose = pose;
  s.them.pose = pose;
};

/** Each level's scene, after the "VS" blows apart. */
export const matchScenes: Readonly<Record<SceneLevel, SceneScript>> = {
  // They walk in slowly, meet in the middle and hold hands under a heart, swaying.
  soulmates: {
    start: () => scene(fighter(-OFF, 1), fighter(OFF, -1)),
    beats: [
      [
        40,
        (s) => {
          go(s.you, -32, 2000);
          go(s.them, 32, 2000);
        },
      ],
      [2040, (s) => both(s, 'hold')],
      [
        2300,
        (s) => {
          s.heart = true;
          s.you.sway = true;
          s.them.sway = true;
        },
      ],
      [2600, (s) => (s.banner = 'PERFECT MATCH')],
    ],
    leaveAt: 5200,
  },
  // They run in, turn to the audience under a spotlight and bow together as confetti falls.
  'co-stars': {
    start: () => scene(fighter(-OFF, 1), fighter(OFF, -1)),
    beats: [
      [
        40,
        (s) => {
          go(s.you, -40, 1000);
          go(s.them, 40, 1000);
        },
      ],
      [
        1040,
        (s) => {
          both(s, 'front');
          s.spotlight = true;
        },
      ],
      [
        1500,
        (s) => {
          both(s, 'bow');
          s.confetti = true;
        },
      ],
      [
        2100,
        (s) => {
          both(s, 'front');
          s.banner = 'TAKE A BOW';
        },
      ],
      [2500, (s) => both(s, 'bow')],
      [3000, (s) => both(s, 'front')],
    ],
    leaveAt: 4600,
  },
  // They run in, high-five in a burst of sparks and team up back to back.
  crossover: {
    start: () => scene(fighter(-OFF, 1), fighter(OFF, -1)),
    beats: [
      [
        40,
        (s) => {
          go(s.you, -34, 800);
          go(s.them, 34, 800);
        },
      ],
      [840, (s) => both(s, 'raise')],
      [
        900,
        (s) => {
          go(s.you, -20, 150, 'raise');
          go(s.them, 20, 150, 'raise');
        },
      ],
      [1050, (s) => (s.burst = { x: 0, y: 66 })],
      [
        1450,
        (s) => {
          go(s.you, -28, 200, 'stand');
          go(s.them, 28, 200, 'stand');
          s.you.face = -1;
          s.them.face = 1;
        },
      ],
      [1700, (s) => (s.banner = 'TEAM UP!')],
    ],
    leaveAt: 4200,
  },
  // They walk in together, stop, look at each other, then walk off in opposite directions.
  'spin-off': {
    start: () => scene(fighter(-OFF - 80, 1), fighter(-OFF, 1)),
    beats: [
      [
        40,
        (s) => {
          go(s.you, -45, 1800);
          go(s.them, 35, 1800);
        },
      ],
      [1840, (s) => both(s, 'stand')],
      [2100, (s) => (s.them.face = -1)],
      [
        2800,
        (s) => {
          s.you.face = -1;
          s.them.face = 1;
          go(s.you, -OFF - 40, 1800);
          go(s.them, OFF + 40, 1800);
        },
      ],
      [3000, (s) => (s.banner = 'TO BE CONTINUED...')],
    ],
    leaveAt: 4900,
  },
  // They walk across the whole header; you pop up at the edge just long enough to wave.
  cameo: {
    start: () => scene(fighter(230, -1, { pose: 'stand', y: 90 }), fighter(-OFF, 1)),
    beats: [
      [40, (s) => go(s.them, OFF, 4200)],
      [
        1300,
        (s) => {
          s.you.glide = 250;
          s.you.y = 0;
          s.you.pose = 'wave';
        },
      ],
      [1400, (s) => (s.banner = 'SPECIAL GUEST')],
      [1600, (s) => (s.you.pose = 'wave2')],
      [1850, (s) => (s.you.pose = 'wave')],
      [2100, (s) => (s.you.pose = 'wave2')],
      [2400, (s) => (s.you.y = 90)],
    ],
    leaveAt: 4400,
  },
  // A saucer beams them down beside you; you both wonder, and it beams them back up and flies off.
  'different-universe': {
    start: () => {
      const s = scene(fighter(-OFF, 1), fighter(70, -1, { pose: 'stand', shown: false }));
      s.saucer.shown = true;
      return s;
    },
    beats: [
      [
        40,
        (s) => {
          go(s.you, -70, 1300);
          s.saucer.glide = 1300;
          s.saucer.x = 70;
        },
      ],
      [1340, (s) => (s.you.pose = 'stand')],
      [1400, (s) => (s.beam = true)],
      [1600, (s) => (s.them.shown = true)],
      [2200, (s) => (s.beam = false)],
      [2400, (s) => (s.questions = true)],
      [
        3600,
        (s) => {
          s.questions = false;
          s.beam = true;
        },
      ],
      [3800, (s) => (s.them.shown = false)],
      [
        4300,
        (s) => {
          s.beam = false;
          s.saucer.glide = 1200;
          s.saucer.x = -OFF - 80;
        },
      ],
      // Once the saucer is clear of the top.
      [5550, (s) => (s.banner = 'WRONG UNIVERSE')],
    ],
    leaveAt: 6900,
  },
};
