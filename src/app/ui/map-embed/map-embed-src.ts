// Pure builder for the Google Maps Embed `place` URL (WD2/WF1). Kept framework-free so it can be
// unit-tested and so the key is only ever read from the generated environment, never hardcoded in src.
export function buildEmbedSrc(key: string, query: string, locale: string, zoom = 12): string {
  const params = new URLSearchParams({ key, q: query, zoom: String(zoom), language: locale });
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}
