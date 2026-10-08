// CV file validation (P10) — pure, framework-free so it's unit-testable and shared by the apply form.
// Mirrors the server gate in supabase/functions/web-apply (pdf/doc/docx, ≤ 5 MB).
export const CV_MAX_MB = 5;
export const CV_ACCEPT = ['.pdf', '.doc', '.docx'];

/** Returns an error key for an invalid CV, or null when it's acceptable. */
export function validateCvFile(name: string, size: number): 'cv_type' | 'cv_size' | null {
  const ext = '.' + (name.split('.').pop() ?? '').toLowerCase();
  if (!CV_ACCEPT.includes(ext)) return 'cv_type';
  if (size > CV_MAX_MB * 1024 * 1024) return 'cv_size';
  return null;
}
