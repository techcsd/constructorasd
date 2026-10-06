import { describe, it, expect } from 'vitest';
import { buildEmbedSrc } from './map-embed-src';

describe('buildEmbedSrc (WD2/WF1)', () => {
  it('builds a Google Maps Embed place URL with the key, query, zoom and language', () => {
    const url = buildEmbedSrc('KEY123', 'Santo Domingo, República Dominicana', 'es');
    expect(url.startsWith('https://www.google.com/maps/embed/v1/place?')).toBe(true);
    const u = new URL(url);
    expect(u.host).toBe('www.google.com');
    expect(u.searchParams.get('key')).toBe('KEY123');
    expect(u.searchParams.get('q')).toBe('Santo Domingo, República Dominicana');
    expect(u.searchParams.get('zoom')).toBe('12');
    expect(u.searchParams.get('language')).toBe('es');
  });

  it('switching office/locale changes the query + language (tab switch)', () => {
    const sd = buildEmbedSrc('K', 'Santo Domingo, República Dominicana', 'es');
    const pc = buildEmbedSrc('K', 'Punta Cana, República Dominicana', 'en');
    expect(sd).not.toBe(pc);
    expect(new URL(pc).searchParams.get('q')).toBe('Punta Cana, República Dominicana');
    expect(new URL(pc).searchParams.get('language')).toBe('en');
  });
});
