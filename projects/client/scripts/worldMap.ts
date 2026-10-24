// Builds the home page's dot map and the place names that turn a profile's free-text location into a country.
// Usage: GEO_DATA_PATH=<dir> bun run world-map. The directory holds world-atlas 2.0.2's countries-50m.json (Natural
// Earth, public domain) and GeoNames' countryInfo.txt and admin1CodesASCII.txt (CC BY 4.0, geonames.org).
// Writes src/lib/home/live/worldDots.json and src/lib/home/live/placeCountries.json. No dependencies: it decodes the
// TopoJSON, projects with the Natural Earth formula and tests points with ray casting itself.

import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';

const source = process.env.GEO_DATA_PATH ?? './assets';
const target = 'src/lib/home/live';

// A 1000 x 470 map with a dot every 7 units: about 2,600 on land.
const WIDTH = 1000;
const HEIGHT = 470;
const STEP = 7;
const MARGIN = 4;

// Spellings people type that aren't a country's English or GeoNames name.
const ALIASES: Record<string, string> = {
  'usa': 'US',
  'us': 'US',
  'u s a': 'US',
  'america': 'US',
  'united states of america': 'US',
  'uk': 'GB',
  'u k': 'GB',
  'england': 'GB',
  'scotland': 'GB',
  'wales': 'GB',
  'northern ireland': 'GB',
  'great britain': 'GB',
  'brasil': 'BR',
  'deutschland': 'DE',
  'espana': 'ES',
  'italia': 'IT',
  'turkiye': 'TR',
  'russia': 'RU',
  'south korea': 'KR',
  'korea': 'KR',
  'holland': 'NL',
  'the netherlands': 'NL',
  'nederland': 'NL',
  'czechia': 'CZ',
  'iran': 'IR',
  'uae': 'AE',
  'schweiz': 'CH',
  'suisse': 'CH',
  'osterreich': 'AT',
  'polska': 'PL',
  'sverige': 'SE',
  'norge': 'NO',
  'danmark': 'DK',
  'suomi': 'FI',
  'belgique': 'BE',
  'belgie': 'BE',
  'ivory coast': 'CI',
  'vietnam': 'VN',
};

type Point = readonly [number, number];
type Ring = readonly Point[];
type Polygon = readonly Ring[];
type Geometry =
  | { type: 'Polygon'; arcs: number[][]; id?: string }
  | { type: 'MultiPolygon'; arcs: number[][][]; id?: string }
  | { type: null; id?: string };
type Topology = {
  transform: { scale: Point; translate: Point };
  arcs: [number, number][][];
  objects: { countries: { geometries: Geometry[] } };
};

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ')
    .trim();

const rows = (text: string) =>
  text.split('\n').filter((line) => line && !line.startsWith('#')).map((line) => line.split('\t'));

const countryRows = rows(await readFile(`${source}/countryInfo.txt`, 'utf8'));
const isoByNumeric = new Map(countryRows.map(([iso2, , numeric]) => [String(Number(numeric)), iso2]));
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

const places = new Map<string, string>();
const add = (name: string | undefined, iso2: string) => {
  const key = normalize(name ?? '');
  if (key && !places.has(key)) places.set(key, iso2);
};
countryRows.forEach(([iso2, iso3, , , name]) => {
  add(name, iso2);
  add(iso3, iso2);
  add(regionNames.of(iso2), iso2);
});
Object.entries(ALIASES).forEach(([name, iso2]) => add(name, iso2));
// GeoNames names some regions "State of Berlin" or "Provincia de Buenos Aires"; people mostly type the bare name.
const withoutPrefix = (name: string) =>
  normalize(name).replace(/^(land|state of|province of|provincia de|provincia di|estado de|region|county) /, '');

// Regions come last so a country's own name wins a clash.
rows(await readFile(`${source}/admin1CodesASCII.txt`, 'utf8')).forEach(([code, name, ascii]) => {
  const iso2 = code.split('.')[0];
  [name, ascii].forEach((each) => {
    add(each, iso2);
    add(withoutPrefix(each ?? ''), iso2);
  });
});

const topology: Topology = JSON.parse(await readFile(`${source}/countries-50m.json`, 'utf8'));
const { scale, translate } = topology.transform;

// Arcs are delta-encoded: each position is the running sum of the ones before it.
const arcs: Ring[] = topology.arcs.map((arc) => {
  const sums = arc.reduce<[number, number][]>((decoded, [dx, dy]) => {
    const [x, y] = decoded.at(-1) ?? [0, 0];
    decoded.push([x + dx, y + dy]);
    return decoded;
  }, []);
  return sums.map(([x, y]) => [x * scale[0] + translate[0], y * scale[1] + translate[1]] as const);
});

const ring = (indexes: readonly number[]): Ring =>
  indexes.flatMap((index, i) => {
    const arc = index < 0 ? arcs[~index].toReversed() : arcs[index];
    return i === 0 ? arc : arc.slice(1);
  });

const polygonsOf = (geometry: Geometry): Polygon[] => {
  if (geometry.type === 'Polygon') return [geometry.arcs.map(ring)];
  if (geometry.type === 'MultiPolygon') return geometry.arcs.map((polygon) => polygon.map(ring));
  return [];
};

type Bounds = readonly [number, number, number, number];
const boundsOf = (points: Ring): Bounds => [
  Math.min(...points.map(([x]) => x)),
  Math.min(...points.map(([, y]) => y)),
  Math.max(...points.map(([x]) => x)),
  Math.max(...points.map(([, y]) => y)),
];

// A ring that crosses the date line jumps from 180 to -180; carry on past it instead, so a ray across it doesn't
// light every dot at that latitude around the world.
const unwrap = (points: Ring): Ring =>
  points.reduce<Point[]>((unwrapped, [lon, lat]) => {
    const previous = unwrapped.at(-1)?.[0] ?? lon;
    unwrapped.push([lon + 360 * Math.round((previous - lon) / 360), lat]);
    return unwrapped;
  }, []);

type Shape = { polygon: Polygon; unwrapped: Polygon; bounds: Bounds };
const countries = topology.objects.countries.geometries
  .map((geometry) => ({
    iso2: isoByNumeric.get(String(Number(geometry.id))),
    polygons: polygonsOf(geometry).map((polygon) => {
      const unwrapped: Polygon = polygon.map(unwrap);
      return { polygon, unwrapped, bounds: boundsOf(unwrapped[0]) };
    }),
  }))
  .filter((country): country is { iso2: string; polygons: Shape[] } =>
    country.iso2 !== undefined && country.iso2 !== 'AQ' && country.polygons.length > 0
  );

const insideRing = ([x, y]: Point, points: Ring) =>
  points.reduce((inside, [xi, yi], i) => {
    const [xj, yj] = points.at(i - 1) ?? [xi, yi];
    return (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi ? !inside : inside;
  }, false);

const insideShape = (point: Point, { unwrapped: [outer, ...holes], bounds: [west, south, east, north] }: Shape) =>
  point[0] >= west && point[0] <= east && point[1] >= south && point[1] <= north &&
  insideRing(point, outer) && !holes.some((hole) => insideRing(point, hole));

// An unwrapped ring can run past ±180, so the point is also tried a turn either side.
const insidePolygon = ([lon, lat]: Point, shape: Shape) =>
  [lon, lon - 360, lon + 360].some((each) => insideShape([each, lat], shape));

// Natural Earth I (Šavrič et al.), in radians.
const RADIANS = Math.PI / 180;
const naturalEarth = (lambda: number, phi: number): Point => {
  const phi2 = phi * phi;
  const phi4 = phi2 * phi2;
  return [
    lambda * (0.8707 - 0.131979 * phi2 + phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4))),
    phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4))),
  ];
};
const inverseLatitude = (y: number) =>
  Array.from({ length: 25 }).reduce<number>((phi) => {
    const phi2 = phi * phi;
    const phi4 = phi2 * phi2;
    const delta = (phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4))) - y) /
      (1.007226 + phi2 * (0.015085 * 3 + phi4 * (-0.044475 * 7 + 0.028874 * 9 * phi2 - 0.005916 * 11 * phi4)));
    return phi - delta;
  }, y);

// Fit the land itself (no Antarctica) into the box, the way d3's fitExtent would.
const projected = countries.flatMap(({ polygons }) =>
  polygons.flatMap(({ polygon: [outer] }) => outer.map(([lon, lat]) => naturalEarth(lon * RADIANS, lat * RADIANS)))
);
const [left, bottom, right, top] = boundsOf(projected);
const fit = Math.min((WIDTH - 2 * MARGIN) / (right - left), (HEIGHT - 2 * MARGIN) / (top - bottom));
const offsetX = (WIDTH - (right - left) * fit) / 2 - left * fit;
const offsetY = (HEIGHT - (top - bottom) * fit) / 2 + top * fit;

const toMap = ([lon, lat]: Point): Point => {
  const [x, y] = naturalEarth(lon * RADIANS, lat * RADIANS);
  return [offsetX + x * fit, offsetY - y * fit];
};
const fromMap = (x: number, y: number): Point | undefined => {
  const phi = inverseLatitude((offsetY - y) / fit);
  if (Math.abs(phi) > Math.PI / 2) return undefined;
  const [unit] = naturalEarth(1, phi);
  const lambda = (x - offsetX) / fit / unit;
  if (Math.abs(lambda) > Math.PI) return undefined;
  return [lambda / RADIANS, phi / RADIANS];
};

const owner = (x: number, y: number) => {
  const point = fromMap(x, y);
  if (!point) return undefined;
  return countries.find(({ polygons }) => polygons.some((polygon) => insidePolygon(point, polygon)))?.iso2;
};

const columns = Math.floor(WIDTH / STEP);
const lines = Math.floor(HEIGHT / STEP);
const center = (cell: number) => cell * STEP + STEP / 2;

const grid = Array.from({ length: lines * columns }, (_, cell) => ({
  column: cell % columns,
  row: Math.floor(cell / columns),
}));
const dots = grid
  .map(({ column, row }) => ({ column, row, iso2: owner(center(column), center(row)) }))
  .filter((dot): dot is { column: number; row: number; iso2: string } => dot.iso2 !== undefined);

// A country too small to hold a grid point still gets one dot, at the middle of its outline.
const taken = new Set(dots.map(({ column, row }) => `${column},${row}`));
const covered = new Set(dots.map(({ iso2 }) => iso2));
const extras = countries
  .filter(({ iso2 }) => !covered.has(iso2))
  .map(({ iso2, polygons }) => {
    const points = polygons.flatMap(({ polygon: [outer] }) => outer);
    const lon = points.reduce((sum, [x]) => sum + x, 0) / points.length;
    const lat = points.reduce((sum, [, y]) => sum + y, 0) / points.length;
    const [x, y] = toMap([lon, lat]);
    return { column: Math.floor(x / STEP), row: Math.floor(y / STEP), iso2 };
  })
  .filter(({ column, row }) => !taken.has(`${column},${row}`));

const all = [...dots, ...extras];
const codes = [...new Set(all.map(({ iso2 }) => iso2))].toSorted();
const worldDots = {
  width: WIDTH,
  height: HEIGHT,
  step: STEP,
  codes,
  dots: all.flatMap(({ column, row, iso2 }) => [column, row, codes.indexOf(iso2)]),
};

await writeFile(`${target}/worldDots.json`, `${JSON.stringify(worldDots, null, 2)}\n`);
await writeFile(`${target}/placeCountries.json`, `${JSON.stringify(Object.fromEntries(places), null, 2)}\n`);
console.log(`Wrote ${all.length} dots in ${codes.length} countries and ${places.size} place names to ${target}`);
