/**
 * Split a heading into {before, em, after} around its emphasised fragment, so the template can wrap
 * `em` in the serif-emphasis span. If the fragment is missing/absent, the whole string is `before`.
 * Shared by the page header and the home hero (same H1 treatment).
 */
export function splitEmphasis(
  full: string,
  em: string | null | undefined,
): { before: string; em: string; after: string } {
  if (!em || !full.includes(em)) return { before: full, em: '', after: '' };
  const i = full.indexOf(em);
  return { before: full.slice(0, i), em, after: full.slice(i + em.length) };
}
