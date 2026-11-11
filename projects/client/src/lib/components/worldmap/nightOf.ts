import type { MapProjection } from './MapProjection.ts';

type Point = { readonly x: number; readonly y: number };
/** A dot's latitude and longitude, in radians. */
export type Place = { readonly phi: number; readonly lambda: number };

const DAY_MS = 86_400_000;
const RADIANS = Math.PI / 180;
/** The sun this far below the horizon (as the cosine of its angle from overhead) is full night. */
const DARK = -0.16;
/** The sun this far above it is full day; twilight fades between. */
const LIGHT = 0.06;

// Natural Earth I (Šavrič et al.), as the map script draws it.
const yOf = (phi: number) => {
  const phi2 = phi * phi;
  const phi4 = phi2 * phi2;
  return phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4)));
};
const slopeOf = (phi: number) => {
  const phi2 = phi * phi;
  const phi4 = phi2 * phi2;
  return 1.007226 + phi2 * (0.045255 + phi4 * (-0.311325 + 0.259866 * phi2 - 0.065076 * phi4));
};
const widthAt = (phi: number) => {
  const phi2 = phi * phi;
  const phi4 = phi2 * phi2;
  return 0.8707 - 0.131979 * phi2 + phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4));
};

/** Where a dot is on Earth, undoing the projection: Newton's method for the latitude, then the longitude. */
export function toPlace({ x, y }: Point, { fit, offsetX, offsetY }: MapProjection): Place {
  const target = (offsetY - y) / fit;
  const phi = Array.from({ length: 12 }).reduce<number>(
    (guess) => guess - (yOf(guess) - target) / slopeOf(guess),
    target,
  );
  return { phi, lambda: (x - offsetX) / fit / widthAt(phi) };
}

/** Where the sun is overhead at `at`: its declination and longitude, close enough to shade a dot map. */
function sunAt(at: Date) {
  const day = (at.getTime() - Date.UTC(at.getUTCFullYear(), 0, 0)) / DAY_MS;
  const hours = at.getUTCHours() + at.getUTCMinutes() / 60;
  return {
    declination: -23.44 * RADIANS * Math.cos((2 * Math.PI * (day + 10)) / 365),
    lambda: (12 - hours) * 15 * RADIANS,
  };
}

/** How dark it is at each place at `at`: 0 in daylight, 1 at night, and in between through twilight. */
export function nightOf(places: readonly Place[], at: Date): number[] {
  const sun = sunAt(at);
  return places.map(({ phi, lambda }) => {
    const height =
      Math.sin(phi) * Math.sin(sun.declination) +
      Math.cos(phi) * Math.cos(sun.declination) * Math.cos(lambda - sun.lambda);
    return Math.min(1, Math.max(0, (LIGHT - height) / (LIGHT - DARK)));
  });
}
