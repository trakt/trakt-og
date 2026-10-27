/** One step of a breadcrumb trail. The page's own last step may go without a path. */
export type Crumb = { readonly name: string; readonly path?: string };
