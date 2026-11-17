const CENTER = 256;
const OUTER = 256;
/** The hole left inside OG's ring icons (circle-quarter-stroke and friends), so the ring matches their weight. */
const INNER = 208;

const round = (value: number) => Math.round(value * 100) / 100;
const point = (radius: number, turn: number) => {
  const angle = turn * 2 * Math.PI;
  return `${round(CENTER + radius * Math.sin(angle))} ${round(CENTER - radius * Math.cos(angle))}`;
};
const circle = (radius: number, sweep: 0 | 1) =>
  `M${CENTER} ${CENTER - radius}A${radius} ${radius} 0 1 ${sweep} ${CENTER} ${CENTER + radius}` +
  `A${radius} ${radius} 0 1 ${sweep} ${CENTER} ${CENTER - radius}Z`;
/** The unwatched wedge, from 12 o'clock back round to the share, wound against the outline. */
const wedge = (filled: number) => {
  const large = 1 - filled > 0.5 ? 1 : 0;
  return `M${CENTER} ${CENTER}L${point(INNER, 1)}A${INNER} ${INNER} 0 ${large} 0 ${point(INNER, filled)}Z`;
};

/**
 * OG's ring icon filled to a share: a solid wedge from 12 o'clock, clockwise, inside the ring's outline. Floored to
 * whole percents like the progress percentages, so the circle only closes when everything's done. The hole winds
 * against the outline, so Icon's nonzero fill cuts it out.
 *   <Icon svg={pieSvg(31 / 39)} />
 */
export function pieSvg(share: number): string {
  const percent = Math.floor((Number.isFinite(share) ? share : 0) * 100 + 1e-9);
  const filled = Math.min(Math.max(percent, 0), 100) / 100;
  const hole = filled === 0 ? circle(INNER, 0) : filled === 1 ? '' : wedge(filled);
  const path = circle(OUTER, 1) + hole;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="${path}"/></svg>`;
}
