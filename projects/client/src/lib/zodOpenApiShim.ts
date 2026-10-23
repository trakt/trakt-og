interface OpenApiExtendable {
  readonly ZodType: { readonly prototype: object };
}

/**
 * Stands in for `@anatine/zod-openapi` in the browser bundle. The contracts only tag schemas with OpenAPI metadata
 * that OG never reads, and the real package's CommonJS build drags a second copy of zod into every page.
 */
export function extendZodWithOpenApi(zod: OpenApiExtendable, forceOverride = false) {
  const prototype: { openapi?: unknown } = zod.ZodType.prototype;
  if (!forceOverride && prototype.openapi !== undefined) return;

  prototype.openapi = function (this: unknown) {
    return this;
  };
}
