export const OPEN_SEARCH_TYPE = 'application/opensearchdescription+xml';

/** The OpenSearch description that lets browsers add og as a search engine, pointed at the host serving it. */
export function buildOpenSearch(origin: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/" xmlns:moz="http://www.mozilla.org/2006/browser/search/">
  <ShortName>Trakt OG Redux</ShortName>
  <Description>Search movies, shows, people and lists on Trakt</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <Image width="16" height="16" type="image/png">${origin}/opensearch-icon.png</Image>
  <Url type="text/html" method="get" template="${origin}/search?query={searchTerms}"/>
  <Url type="${OPEN_SEARCH_TYPE}" rel="self" template="${origin}/opensearch.xml"/>
  <moz:SearchForm>${origin}/search</moz:SearchForm>
</OpenSearchDescription>
`;
}
