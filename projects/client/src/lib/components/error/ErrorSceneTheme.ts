import type { SceneMotion } from './SceneMotion.ts';

/** The show or movie an error page is dressed as: its still, a line from it, and the colors the page takes on. */
export type ErrorSceneTheme = {
  readonly source: string;
  /** The source's summary page in og, which its tag links to. */
  readonly href: string;
  readonly quote: string;
  /** After the slash in the tag. Left out when the source says who (E.T.) or the line is OG's own. */
  readonly speaker?: string;
  /** No still means the motion layer is the whole picture. */
  readonly art?: string;
  readonly artPosition?: string;
  /** Custom properties from tokens.css: the ground the still fades into, and the motion's and label's color. */
  readonly tint: string;
  readonly accent: string;
  readonly motion: SceneMotion;
};
