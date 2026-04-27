import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaInstallComponent } from './shared/components/pwa-install/pwa-install';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PwaInstallComponent],
  template: `
    <router-outlet />
    <app-pwa-install />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
