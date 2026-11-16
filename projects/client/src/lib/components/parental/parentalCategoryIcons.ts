import faceSwear from '#lib/icons/regular/face-swear.svg?raw';
import ghost from '#lib/icons/regular/ghost.svg?raw';
import knife from '#lib/icons/regular/knife.svg?raw';
import lips from '#lib/icons/regular/lips.svg?raw';
import pills from '#lib/icons/regular/pills.svg?raw';
import type { ParentalCategory } from '../filters/parentalGuide.ts';

/** Each parental guide category's icon, for the page's tiles and the summary badge's tooltip. */
export const parentalCategoryIcons: Readonly<Record<ParentalCategory, string>> = {
  nudity: lips,
  violence: knife,
  profanity: faceSwear,
  alcohol: pills,
  frightening: ghost,
};
