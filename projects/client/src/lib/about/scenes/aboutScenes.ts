import type { AboutScene } from './AboutScene.ts';
import { matrixScene } from './matrixScene.ts';
import { robotScene } from './robotScene.ts';
import { tronScene } from './tronScene.ts';

/** The scenes behind the about page's header; each visit gets one at random. */
export const aboutScenes: readonly AboutScene[] = [matrixScene, tronScene, robotScene];
