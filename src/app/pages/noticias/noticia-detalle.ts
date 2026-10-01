import { ChangeDetectionStrategy, Component, computed, inject, SecurityContext } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';
import { I18nService } from '../../core/i18n/i18n.service';
import { SeoService } from '../../core/seo/seo.service';
import { getPost } from '../../../content/posts';
import { detailPathFor, pathFor } from '../../core/i18n/localized-routes';
import { Button } from '../../ui/button/button';
import { ImageFigure } from '../../ui/image-figure/image-figure';
import { TPipe } from '../../core/i18n/t.pipe';

/**
 * News article. Body markdown → marked → sanitized with Angular's DomSanitizer (SSR-safe; equivalent
 * protection to DOMPurify without a jsdom dependency at prerender time — see DESIGN-DECISIONS).
 */
@Component({
  selector: 'app-noticia-detalle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, ImageFigure, TPipe],
  templateUrl: './noticia-detalle.html',
  styleUrl: './noticia-detalle.scss',
})
export class NoticiaDetalle {
  private route = inject(ActivatedRoute);
  private i18n = inject(I18nService);
  private seo = inject(SeoService);
  private sanitizer = inject(DomSanitizer);

  readonly slug = this.route.snapshot.paramMap.get('slug') ?? '';
  readonly post = computed(() => getPost(this.slug));
  readonly noticiasPath = computed(() => pathFor('noticias', this.i18n.locale()) ?? '/noticias');

  readonly title = computed(() => this.i18n.pick(this.post()?.title) ?? '');
  readonly coverAlt = computed(() => {
    const c = this.post()?.cover;
    return c ? this.i18n.pick(c.alt)! : '';
  });
  readonly bodyHtml = computed(() => {
    const p = this.post();
    if (!p) return '';
    const md = this.i18n.locale() === 'en' ? p.body.en : p.body.es;
    const html = marked.parse(md, { async: false }) as string;
    return this.sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
  });

  constructor() {
    const p = this.post();
    if (p) {
      this.seo.set({
        title: this.i18n.pick(p.title) ?? '',
        description: this.i18n.pick(p.excerpt) ?? '',
        routeKey: 'noticias',
        locale: this.i18n.locale(),
        path: detailPathFor('noticia', this.slug, this.i18n.locale())!,
        altPaths: { es: detailPathFor('noticia', this.slug, 'es'), en: detailPathFor('noticia', this.slug, 'en') },
        type: 'article',
      });
    } else {
      this.seo.set({
        title: this.i18n.t('Página no encontrada'),
        description: '',
        routeKey: 'noticias',
        locale: this.i18n.locale(),
        noindex: true,
      });
    }
  }
}
