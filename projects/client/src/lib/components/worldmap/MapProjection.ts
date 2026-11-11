/** How the map script fit Natural Earth into the grid: map units per radian, and where 0°, 0° lands. */
export type MapProjection = { readonly fit: number; readonly offsetX: number; readonly offsetY: number };
