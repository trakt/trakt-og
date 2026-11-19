type Box = Readonly<{ scrollWidth: number; clientWidth: number; scrollHeight: number; clientHeight: number }>;

/** Whether a line-clamped or ellipsized box hides some of its text, across or down. */
export function cutsOff({ scrollWidth, clientWidth, scrollHeight, clientHeight }: Box): boolean {
  return scrollWidth > clientWidth || scrollHeight > clientHeight;
}
