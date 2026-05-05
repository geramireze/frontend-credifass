import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-pwa-update',
  templateUrl: './pwa-update.html',
  styleUrl: './pwa-update.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PwaUpdate implements OnInit, OnDestroy {
  private readonly swUpdate = inject(SwUpdate);

  protected readonly visible    = signal(false);
  protected readonly actualizando = signal(false);
  protected readonly version    = environment.version;

  private readonly onFocus = () => {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.checkForUpdate().catch(() => {});
    }
  };

  ngOnInit(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.visible.set(true));

    window.addEventListener('focus', this.onFocus);
  }

  ngOnDestroy(): void {
    window.removeEventListener('focus', this.onFocus);
  }

  protected async actualizar(): Promise<void> {
    this.actualizando.set(true);
    try {
      await this.swUpdate.activateUpdate();
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      window.location.reload();
    } catch {
      this.actualizando.set(false);
    }
  }

  protected dismiss(): void {
    this.visible.set(false);
  }
}
