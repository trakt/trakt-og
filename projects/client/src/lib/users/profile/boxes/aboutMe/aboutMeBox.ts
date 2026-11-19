import { defineProfileBox } from '../defineProfileBox.ts';
import AboutMeBox from './AboutMeBox.svelte';
import { toAboutMe } from './toAboutMe.ts';

/** The owner's own words, pinned first whenever they wrote some, and on your own empty profile a prompt to. */
export const aboutMeBox = defineProfileBox({
  key: 'about',
  group: 'colour',
  pinned: true,
  component: AboutMeBox,
  score: ({ profile, isSelf }) => (profile.about ? 100 : isSelf ? 0 : null),
  view: toAboutMe,
});
