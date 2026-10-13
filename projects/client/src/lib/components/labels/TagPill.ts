/**
 * One pill in TagPills: `primary` is the brand red, `light` the pale one, `badge` a bold, clear-filled pill with a
 * brighter outline (a rating certificate), and no kind the dark outlined default. A `lead` goes before the text in
 * bold, like a count pill's number.
 */
export type TagPill = { readonly text: string; readonly lead?: string; readonly kind?: 'primary' | 'light' | 'badge' };
