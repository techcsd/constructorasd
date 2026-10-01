import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface ClientWallItem {
  name: string;
  logo?: string;
}

/**
 * ClientWall (DESIGN-BRIEF §6). Logos in grayscale at 60% opacity on a hairline grid; where a logo is
 * missing, the client NAME is rendered in small uppercase (never a placeholder image).
 */
@Component({
  selector: 'app-client-wall',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './client-wall.html',
  styleUrl: './client-wall.scss',
})
export class ClientWall {
  readonly clients = input.required<ClientWallItem[]>();
}
