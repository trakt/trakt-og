/** app.html's site-wide head tags, for a page served without it (`crawl/previewHead.ts`). */
export const SITE_TAGS = [
  '<meta property="og:site_name" content="Trakt OG Redux" />',
  '<meta property="og:locale" content="en_US" />',
  '<meta name="twitter:card" content="summary_large_image" />',
  '<meta name="twitter:site" content="@trakt" />',
  '<link rel="icon" href="/favicon.ico" sizes="32x32" />',
  '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />',
] as const;
