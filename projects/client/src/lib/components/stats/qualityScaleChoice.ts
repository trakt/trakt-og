const STORAGE_KEY = 'og:quality-scale';

/** The Quality chart's Scale: zoomed to its lines, or the whole 0 to 100%. */
export type QualityScaleChoice = 'zoom' | 'full';

/** The Scale this browser last picked on a Quality chart, so a viewer who prefers 0 to 100% keeps it. */
export const qualityScaleChoice = {
  read(): QualityScaleChoice {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'full' ? 'full' : 'zoom';
    } catch {
      return 'zoom';
    }
  },
  write(choice: QualityScaleChoice) {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Without storage the chart opens zoomed next time, which is the default anyway.
    }
  },
};
