/** A fetched page, read once. */
export interface PageResponse {
  status: number;
  headers: Headers;
  body: string;
}
