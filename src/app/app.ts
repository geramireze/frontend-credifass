import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaInstallComponent } from './shared/components/pwa-install/pwa-install';
import { PwaUpdate } from './shared/components/pwa-update/pwa-update';
import { OfflineQueue } from './core/offline/offline-queue';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PwaInstallComponent, PwaUpdate],
  template: `
    <router-outlet />
    <app-pwa-install />
    <app-pwa-update />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // Instanciar el servicio aquí garantiza que el listener 'online' se
  // registre en el arranque de la app, antes de que el usuario navegue.
  private readonly _queue = inject(OfflineQueue);
}
