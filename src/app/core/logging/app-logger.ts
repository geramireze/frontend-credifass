import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

type LogContext = Record<string, unknown>;

@Injectable({
  providedIn: 'root',
})
export class AppLoggerService {
  debug(evento: string, ctx?: LogContext): void {
    if (!environment.production) {
      console.debug(`[DEBUG] ${evento}`, ctx ?? '');
    }
  }

  info(evento: string, ctx?: LogContext): void {
    if (!environment.production) {
      console.info(`[INFO] ${evento}`, ctx ?? '');
    }
  }

  warn(evento: string, ctx?: LogContext): void {
    console.warn(`[WARN] ${evento}`, ctx ?? '');
  }

  error(evento: string, ctx?: LogContext): void {
    console.error(`[ERROR] ${evento}`, ctx ?? '');
  }
}
