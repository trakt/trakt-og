/** A trailing debounce around `refresh`: a burst of calls runs it once, `delay` after the last one. */
export function createRefreshSoon(refresh: () => Promise<void>, delay = 1500) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      void refresh();
    }, delay);
  };
}
