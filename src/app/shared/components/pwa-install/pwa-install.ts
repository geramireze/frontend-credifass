import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { AppIconComponent } from '../icon/icon';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Component({
  selector: 'app-pwa-install',
  imports: [AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div
        role="dialog"
        aria-label="Instalar aplicación"
        class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80
               bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-4
               flex items-start gap-3 z-50 animate-slide-up"
      >
        <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-[#6366F1] shrink-0">
          <app-icon name="smartphone" [size]="20" class="text-white" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-[#0F172A]">Instalar CrediFass</p>
          <p class="text-xs text-[#64748B] mt-0.5 leading-snug">
            Accede más rápido desde tu pantalla de inicio.
          </p>
          <div class="flex gap-2 mt-3">
            <button
              (click)="install()"
              class="flex-1 h-8 rounded-lg bg-[#6366F1] text-white text-xs font-semibold
                     hover:bg-[#4F46E5] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            >
              Instalar
            </button>
            <button
              (click)="dismiss()"
              class="flex-1 h-8 rounded-lg border border-[#E2E8F0] text-[#64748B] text-xs
                     hover:bg-[#F8FAFC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
              aria-label="Cerrar"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          (click)="dismiss()"
          class="text-[#94A3B8] hover:text-[#64748B] shrink-0 focus:outline-none"
          aria-label="Cerrar"
        >
          <app-icon name="x" [size]="16" />
        </button>
      </div>
    }
  `,
})
export class PwaInstallComponent implements OnInit, OnDestroy {
  protected readonly visible = signal(false);
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  private readonly onBeforeInstall = (e: Event) => {
    e.preventDefault();
    this.deferredPrompt = e as BeforeInstallPromptEvent;
    // Only show if not already installed and not dismissed in this session
    if (!sessionStorage.getItem('pwa-install-dismissed')) {
      this.visible.set(true);
    }
  };

  ngOnInit(): void {
    window.addEventListener('beforeinstallprompt', this.onBeforeInstall);
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeinstallprompt', this.onBeforeInstall);
  }

  protected async install(): Promise<void> {
    if (!this.deferredPrompt) return;
    await this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.visible.set(false);
    }
    this.deferredPrompt = null;
  }

  protected dismiss(): void {
    sessionStorage.setItem('pwa-install-dismissed', '1');
    this.visible.set(false);
  }
}
