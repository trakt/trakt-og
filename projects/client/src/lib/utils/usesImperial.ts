const IMPERIAL_REGIONS = new Set(['US', 'LR', 'MM']);

/** Whether the first language in an `Accept-Language` header is from a region that measures in feet and inches. */
export function usesImperial(languages: string | null | undefined) {
  const region = languages?.split(',')[0]?.match(/-([a-z]{2})(?:-|;|$)/i)?.[1];
  return !!region && IMPERIAL_REGIONS.has(region.toUpperCase());
}
