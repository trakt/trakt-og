import type { AboutScene } from '../about/scenes/AboutScene.ts';
import { helpScenes } from './scenes/helpScenes.ts';

/** The help page's scene for this visit, picked on the server so its title is in the first paint. */
export function pickHelpScene(random: () => number): AboutScene['key'] {
  const picked = helpScenes[Math.floor(random() * helpScenes.length)] ?? helpScenes[0];
  return picked?.scene.key ?? 'sonar';
}
