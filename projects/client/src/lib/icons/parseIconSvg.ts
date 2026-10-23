interface IconSvg {
  readonly viewBox: string;
  readonly pathData: string;
}

const parsed = new Map<string, IconSvg>();

/** Reads the viewBox and single path out of an SVG written by `deno task icon`. */
export function parseIconSvg(svg: string): IconSvg {
  const cached = parsed.get(svg);
  if (cached) return cached;

  const viewBox = svg.match(/viewBox="([^"]+)"/)?.at(1);
  const pathData = svg.match(/<path[^>]*\sd="([^"]+)"/)?.at(1);
  if (!viewBox || !pathData) throw new Error('Not an icon SVG from `deno task icon`: it needs a viewBox and one path.');

  const icon = { viewBox, pathData };
  parsed.set(svg, icon);
  return icon;
}
