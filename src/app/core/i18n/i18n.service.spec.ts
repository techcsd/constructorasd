import { describe, it, expect } from 'vitest';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  it('returns the Spanish key unchanged in es (keys ARE the Spanish text)', () => {
    const i18n = new I18nService();
    expect(i18n.t('Contacto')).toBe('Contacto');
  });

  it('returns the English translation in en', () => {
    const i18n = new I18nService();
    i18n.setLocale('en');
    expect(i18n.t('Contacto')).toBe('Contact');
    expect(i18n.t('Proyectos')).toBe('Projects');
  });

  it('falls back to Spanish when a key has no English', () => {
    const i18n = new I18nService();
    i18n.setLocale('en');
    expect(i18n.t('Una clave inexistente')).toBe('Una clave inexistente');
  });

  it('interpolates params', () => {
    const i18n = new I18nService();
    expect(i18n.t('Hola {name}', { name: 'Xaviel' })).toBe('Hola Xaviel');
  });

  it('pick() resolves a {es,en} field by locale', () => {
    const i18n = new I18nService();
    const field = { es: 'Empresa', en: 'Company' };
    expect(i18n.pick(field)).toBe('Empresa');
    i18n.setLocale('en');
    expect(i18n.pick(field)).toBe('Company');
  });

  it('ignores invalid locales', () => {
    const i18n = new I18nService();
    // @ts-expect-error — testing runtime guard
    i18n.setLocale('fr');
    expect(i18n.locale()).toBe('es');
  });
});
