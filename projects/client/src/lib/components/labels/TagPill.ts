/**
 * One pill in TagPills: `primary` is the brand red, `light` the pale one, `badge` a bold, clear-filled pill with a
 * brighter outline (a rating certificate), and no kind the dark outlined default.
 */
export type TagPill = { readonly text: string; readonly kind?: 'primary' | 'light' | 'badge' };
