import bolt from '$lib/icons/solid/bolt.svg?raw';
import bookOpenReader from '$lib/icons/solid/book-open-reader.svg?raw';
import child from '$lib/icons/solid/child.svg?raw';
import compass from '$lib/icons/solid/compass.svg?raw';
import dragon from '$lib/icons/solid/dragon.svg?raw';
import faceLaughSquint from '$lib/icons/solid/face-laugh-squint.svg?raw';
import gift from '$lib/icons/solid/gift.svg?raw';
import gun from '$lib/icons/solid/gun.svg?raw';
import hatCowboy from '$lib/icons/solid/hat-cowboy.svg?raw';
import hatWizard from '$lib/icons/solid/hat-wizard.svg?raw';
import heart from '$lib/icons/solid/heart.svg?raw';
import landmark from '$lib/icons/solid/landmark.svg?raw';
import magnifyingGlass from '$lib/icons/solid/magnifying-glass.svg?raw';
import mask from '$lib/icons/solid/mask.svg?raw';
import masksTheater from '$lib/icons/solid/masks-theater.svg?raw';
import music from '$lib/icons/solid/music.svg?raw';
import palette from '$lib/icons/solid/palette.svg?raw';
import peopleRoof from '$lib/icons/solid/people-roof.svg?raw';
import personRifle from '$lib/icons/solid/person-rifle.svg?raw';
import rocket from '$lib/icons/solid/rocket.svg?raw';
import skull from '$lib/icons/solid/skull.svg?raw';
import stopwatch from '$lib/icons/solid/stopwatch.svg?raw';
import userSecret from '$lib/icons/solid/user-secret.svg?raw';
import video from '$lib/icons/solid/video.svg?raw';
import type { tasteGenres } from '../../firstNight/taste.ts';

/** Each genre's solid icon, by the name `tasteGenres` gives it. */
export const genreIcons: Readonly<Record<(typeof tasteGenres)[number]['icon'], string>> = {
  'bolt': bolt,
  'book-open-reader': bookOpenReader,
  'child': child,
  'compass': compass,
  'dragon': dragon,
  'face-laugh-squint': faceLaughSquint,
  'gift': gift,
  'gun': gun,
  'hat-cowboy': hatCowboy,
  'hat-wizard': hatWizard,
  'heart': heart,
  'landmark': landmark,
  'magnifying-glass': magnifyingGlass,
  'mask': mask,
  'masks-theater': masksTheater,
  'music': music,
  'palette': palette,
  'people-roof': peopleRoof,
  'person-rifle': personRifle,
  'rocket': rocket,
  'skull': skull,
  'stopwatch': stopwatch,
  'user-secret': userSecret,
  'video': video,
};
