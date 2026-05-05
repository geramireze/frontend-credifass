import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  body: unknown;
  headers: Record<string, string>;
  timestamp: number;
  retries: number;
}

const STORAGE_KEY = 'offline_queue';
const MAX_RETRIES = 5;

@Injectable({ providedIn: 'root' })
export class OfflineQueue implements OnDestroy {
  private readonly http = inject(HttpClient);
  private syncing = false;

  private onOnline = (): void => { void this.flush(); };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onOnline);
      // Intentar flush inmediato si hay pendientes al iniciar con red
      if (navigator.onLine) void this.flush();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onOnline);
  }

  enqueue(
    url: string,
    method: QueuedRequest['method'],
    body: unknown,
    headers: Record<string, string> = {},
  ): string {
    const item: QueuedRequest = {
      id: crypto.randomUUID(),
      url,
      method,
      body,
      headers,
      timestamp: Date.now(),
      retries: 0,
    };
    const queue = this.load();
    queue.push(item);
    this.save(queue);
    return item.id;
  }

  count(): number {
    return this.load().length;
  }

  async flush(): Promise<void> {
    if (this.syncing) return;
    const queue = this.load();
    if (!queue.length) return;

    this.syncing = true;
    const remaining: QueuedRequest[] = [];

    for (const item of queue) {
      if (item.retries >= MAX_RETRIES) continue; // descartar permanentemente
      try {
        await firstValueFrom(
          this.http.request(item.method, item.url, {
            body: item.body,
            headers: item.headers,
          }),
        );
        // éxito — no agregar a remaining
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (status === 401 || status === 403 || status === 422) {
          continue; // error permanente — descartar
        }
        remaining.push({ ...item, retries: item.retries + 1 });
      }
    }

    this.save(remaining);
    this.syncing = false;
  }

  private load(): QueuedRequest[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as QueuedRequest[]) : [];
    } catch {
      return [];
    }
  }

  private save(queue: QueuedRequest[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch {
      // storage llena
    }
  }
}
