import type { AboutScene } from '../../about/scenes/AboutScene.ts';
import { encountersScene } from './encountersScene.ts';
import { houstonScene } from './houstonScene.ts';
import { sonarScene } from './sonarScene.ts';

/** A scene behind the help page's header, with the title that quotes its film: plain, then in red. */
export type HelpScene = { readonly scene: AboutScene; readonly lead: string; readonly accent: string };

/** Films about sending a signal and getting an answer; each visit gets one at random. */
export const helpScenes: readonly HelpScene[] = [
  { scene: sonarScene, lead: 'One ping,', accent: "and we're on it." },
  { scene: houstonScene, lead: 'Houston,', accent: 'we have a problem.' },
  { scene: encountersScene, lead: 'Say hello.', accent: "We'll answer." },
];
