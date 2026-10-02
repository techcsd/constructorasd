// Build-time content overrides from web.site_content. The file _overrides.json is regenerated at prebuild
// by scripts/gen-content.mjs (fetches the DB); committed as {} so local dev + fresh checkouts compile and
// fall back to the hardcoded seeds. Each content file wraps its seed with ov('key', seed): DB wins if present.
import overrides from './_overrides.json';

const OV = (overrides ?? {}) as Record<string, unknown>;

export function ov<T>(key: string, seed: T): T {
  const v = OV[key];
  return v === undefined || v === null ? seed : (v as T);
}
