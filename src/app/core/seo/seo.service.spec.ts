import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, DOCUMENT } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('applies the title template with the brand suffix', () => {
    const seo = TestBed.inject(SeoService);
    seo.set({ title: 'Empresa', description: 'd', routeKey: 'empresa', locale: 'es' });
    expect(TestBed.inject(Title).getTitle()).toContain('Empresa — Constructora SD');
  });

  it('writes a canonical link and an hreflang pair', () => {
    const seo = TestBed.inject(SeoService);
    const doc = TestBed.inject(DOCUMENT);
    seo.set({ title: 'Servicios', description: 'd', routeKey: 'servicios', locale: 'es' });
    expect(doc.head.querySelector('link[rel="canonical"]')).toBeTruthy();
    expect(doc.head.querySelector('link[rel="alternate"][hreflang="en"]')).toBeTruthy();
    expect(doc.head.querySelector('link[rel="alternate"][hreflang="es"]')).toBeTruthy();
  });

  it('forces noindex on non-prod builds', () => {
    const seo = TestBed.inject(SeoService);
    seo.set({ title: 'Home', description: 'd', routeKey: 'home', locale: 'es' });
    const robots = TestBed.inject(Meta).getTag('name="robots"');
    expect(robots?.content).toContain('noindex');
  });
});
