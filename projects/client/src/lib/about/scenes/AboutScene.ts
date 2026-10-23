/** The scene colors, read from the `--color-about-scene-*` tokens on the canvas. */
export type AboutScenePalette = { readonly red: string; readonly cyan: string; readonly ink: string };

export type AboutSceneStart = (params: {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  palette: AboutScenePalette;
  /** Recent changes as `sha type(scope): subject`, for scenes that show them. */
  lines: readonly string[];
}) => (time: number) => void;

/**
 * One film-inspired scene behind the about page's header. `start` sets it up for a canvas this size and returns the
 * frame that draws it at a time in milliseconds. Under reduced motion the page draws `still` frames, then stops.
 */
export type AboutScene = {
  readonly key: 'matrix' | 'tron' | 'robot';
  readonly still: number;
  /** The header's shade over this scene. */
  readonly shade: 'full' | 'grid';
  readonly start: AboutSceneStart;
};
