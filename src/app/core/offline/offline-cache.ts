import { Injectable } from '@angular/core';

const PREFIX = 'app_cache_';
const TTL_MS = 10 * 60 * 1000; // 10 minutos

interface CacheEntry<T> {
  data: T;
  ts: number;
}

@Injectable({ providedIn: 'root' })
export class OfflineCache {
  set<T>(key: string, data: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify({ data, ts: Date.now() } satisfies CacheEntry<T>));
    } catch {
      // cuota de storage llena — ignorar
    }
  }

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw) as CacheEntry<T>;
      if (Date.now() - entry.ts > TTL_MS) {
        localStorage.removeItem(PREFIX + key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  /** Devuelve el dato cacheado sin importar su antigüedad (fallback offline). */
  getStale<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as CacheEntry<T>).data : null;
    } catch {
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key);
  }
}
