import { designCatalog, type DesignDemo } from './designCatalog.ts';

/** The demo a `/_design/...` path shows, with its nav group. The index and unknown paths have none. */
export function findDesignDemo(pathname: string): (DesignDemo & { readonly group: string }) | undefined {
  const slug = pathname.replace(/^\/_design\/?/, '').split('/').at(0);
  if (!slug) return undefined;

  return designCatalog
    .flatMap(({ name, demos }) => demos.map((demo) => ({ ...demo, group: name })))
    .find((demo) => demo.slug === slug);
}
