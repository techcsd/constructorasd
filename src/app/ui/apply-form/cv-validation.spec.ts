import { validateCvFile } from './cv-validation';

// P10 — CV gate: PDF/DOC/DOCX accepted; wrong type and > 5 MB rejected.
describe('validateCvFile (P10)', () => {
  it('accepts a PDF', () => expect(validateCvFile('cv.pdf', 1024)).toBeNull());
  it('accepts a DOC', () => expect(validateCvFile('cv.doc', 1024)).toBeNull());
  it('accepts a DOCX (case-insensitive)', () => expect(validateCvFile('Hoja-de-Vida.DOCX', 50 * 1024)).toBeNull());
  it('rejects a .txt', () => expect(validateCvFile('cv.txt', 1024)).toBe('cv_type'));
  it('rejects an image', () => expect(validateCvFile('cv.png', 1024)).toBe('cv_type'));
  it('rejects a file with no extension', () => expect(validateCvFile('cv', 1024)).toBe('cv_type'));
  it('rejects a PDF over 5 MB', () => expect(validateCvFile('cv.pdf', 6 * 1024 * 1024)).toBe('cv_size'));
  it('accepts a PDF exactly at 5 MB', () => expect(validateCvFile('cv.pdf', 5 * 1024 * 1024)).toBeNull());
});
