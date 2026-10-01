import manifestJson from '../../../content/image-manifest.json';

interface Entry {
  width: number;
  height: number;
  aspect: number;
  widths: number[];
  variants: { avif: Record<string, string>; webp: Record<string, string> };
}
const MANIFEST = manifestJson as unknown as Record<string, Entry>;

/**
 * OG/Twitter share-image URL (root-relative) for a manifest image key. Picks the largest WebP variant
 * that actually exists — so images with only a small source (e.g. plaza-roque, 480w) still resolve
 * instead of 404-ing on a hardcoded `-1280.webp`. Returns undefined for unknown keys.
 */
export function ogImageFor(key: string | undefined): string | undefined {
  if (!key) return undefined;
  const e = MANIFEST[key];
  if (!e || !e.widths?.length) return undefined;
  const w = e.widths[e.widths.length - 1];
  return e.variants.webp[String(w)];
}
