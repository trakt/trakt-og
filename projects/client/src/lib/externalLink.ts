/** Anchor attributes for an href: links that leave og (v3 web, outside sites) open in a new tab, og's own stay put. */
export const externalLink = (href = '') => /^https?:\/\//.test(href) ? { target: '_blank', rel: 'noopener' } : {};
