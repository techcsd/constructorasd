// Build-time content overrides from web.site_content. The file _overrides.json is regenerated at prebuild
// by scripts/gen-content.mjs (fetches the DB); committed as {} so local dev + fresh checkouts compile and
// fall back to the hardcoded seeds. Each content file wraps its seed with ov('key', seed): DB wins if present.
import overrides from './_overrides.json';

const OV = (overrides ?? {}) as Record<string, unknown>;

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

export function ov<T>(key: string, seed: T): T {
  const v = OV[key];
  if (v === undefined || v === null) return seed;
  // Shallow-merge object seeds so a field added to the seed after the DB override was saved (e.g.
  // company.offices, WD2) still appears — the DB wins only for the fields it actually carries. Arrays
  // and primitives replace wholesale (that is the CMS's intent for lists like projects/clients).
  if (isPlainObject(seed) && isPlainObject(v)) return { ...seed, ...v } as T;
  return v as T;
}
