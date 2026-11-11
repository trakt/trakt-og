/** Steers a private profile's sky from outside its canvas. */
export interface SkyControl {
  /** Sends a courier ship off from the middle of `from`, a box in the viewport like a `DOMRect`. */
  launch(from: { left: number; top: number; width: number; height: number }): void;
}
