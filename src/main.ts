import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

bootstrapApplication(App, appConfig)
  .then(() => {
    // provideServiceWorker() en app.config.ts registra ngsw-worker.js (GETs).
    // Este registro adicional cubre escrituras offline (POSTs de pagos/abonos).
    if (environment.production && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-offline-sync.js').catch(console.error);
    }
  })
  .catch((err) => console.error(err));
