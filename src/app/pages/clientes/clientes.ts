import { ChangeDetectionStrategy, Component } from '@angular/core';
import { applyPageSeo } from '../../core/seo/page-seo';
import { CLIENTS } from '../../../content/clients';
import { ClientGroup } from '../../../content/types';
import { PageHeader } from '../../ui/page-header/page-header';
import { Eyebrow } from '../../ui/eyebrow/eyebrow';
import { ClientWall } from '../../ui/client-wall/client-wall';
import { RevealDirective } from '../../core/reveal.directive';
import { TPipe } from '../../core/i18n/t.pipe';

const GROUP_LABEL: Record<ClientGroup, string> = {
  promotores: 'Promotores y constructoras',
  hoteleria: 'Hotelería',
  industria_mineria: 'Industria y minería',
  instituciones: 'Instituciones',
};

@Component({
  selector: 'app-clientes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeader, Eyebrow, ClientWall, RevealDirective, TPipe],
  templateUrl: './clientes.html',
  styleUrl: './clientes.scss',
})
export class Clientes {
  constructor() {
    applyPageSeo('clientes');
  }
  readonly groups = (Object.keys(GROUP_LABEL) as ClientGroup[]).map((g) => ({
    label: GROUP_LABEL[g],
    clients: CLIENTS.filter((c) => c.group === g).map((c) => ({ name: c.name })),
  }));
}
