import { describe, it, expect } from 'vitest';
import { contrastRatio, passesAA, relativeLuminance } from './contrast';

describe('contrast helper', () => {
  it('black on white is 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('same color is 1:1', () => {
    expect(contrastRatio('#C2410C', '#C2410C')).toBeCloseTo(1, 5);
  });

  it('white is brighter than ink', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeGreaterThan(
      relativeLuminance({ r: 20, g: 21, b: 22 }),
    );
  });

  it('ink text on bone passes AA', () => {
    expect(passesAA('#141516', '#F4F1EB')).toBe(true);
  });

  it('white on oxide-500 passes AA (CTA label)', () => {
    expect(passesAA('#FFFFFF', '#C2410C')).toBe(true);
  });

  it('supports 3-digit hex', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 0);
  });
});
