import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaInstallComponent } from './shared/components/pwa-install/pwa-install';
import { OfflineQueue } from './core/offline/offline-queue';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PwaInstallComponent],
  template: `
    <router-outlet />
    <app-pwa-install />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // Instanciar el servicio aquí garantiza que el listener 'online' se
  // registre en el arranque de la app, antes de que el usuario navegue.
  private readonly _queue = inject(OfflineQueue);
}
