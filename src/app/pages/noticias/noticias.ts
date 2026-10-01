import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { applyPageSeo } from '../../core/seo/page-seo';
import { detailPathFor } from '../../core/i18n/localized-routes';
import { POSTS } from '../../../content/posts';
import { COMPANY } from '../../../content/company';
import { PageHeader } from '../../ui/page-header/page-header';
import { ImageFigure } from '../../ui/image-figure/image-figure';
import { Icon } from '../../ui/icon/icon';
import { RevealDirective } from '../../core/reveal.directive';
import { TPipe } from '../../core/i18n/t.pipe';

@Component({
  selector: 'app-noticias',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, ImageFigure, Icon, RevealDirective, TPipe],
  templateUrl: './noticias.html',
  styleUrl: './noticias.scss',
})
export class Noticias {
  private i18n = inject(I18nService);
  constructor() {
    applyPageSeo('noticias');
  }
  readonly instagram = 'https://www.instagram.com/' + COMPANY.instagram;
  readonly posts = computed(() =>
    POSTS.map((p) => ({
      slug: p.slug,
      title: this.i18n.pick(p.title)!,
      excerpt: this.i18n.pick(p.excerpt)!,
      date: p.publishedAt,
      cover: p.cover?.src ?? '',
      coverAlt: p.cover ? this.i18n.pick(p.cover.alt)! : '',
      href: detailPathFor('noticia', p.slug, this.i18n.locale()) ?? '',
    })),
  );
  readonly hasPosts = computed(() => this.posts().length > 0);
}
