import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OfflineService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  base = 'http://localhost:3000/api/v1';

  db(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open('gymsync-offline', 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('queue')) {
            db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
          }
          if (!db.objectStoreNames.contains('cache')) {
            db.createObjectStore('cache', { keyPath: 'key' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this.dbPromise;
  }

  async enqueue(method: string, url: string, body?: any) {
    const db = await this.db();
    const tx = db.transaction('queue', 'readwrite');
    const store = tx.objectStore('queue');
    const req = store.add({ method, url, body, created_at: new Date().toISOString() });
    await new Promise((res, rej) => { req.onsuccess = () => res(true); req.onerror = () => rej(req.error); });
  }

  async syncAll() {
    const db = await this.db();
    const tx = db.transaction('queue', 'readonly');
    const store = tx.objectStore('queue');
    const req = store.getAll();
    const items = await new Promise<any[]>((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
    for (const item of items) {
      try {
        await fetch(item.url, { method: item.method, headers: { 'Content-Type': 'application/json' }, body: item.body ? JSON.stringify(item.body) : undefined });
        const del = db.transaction('queue', 'readwrite').objectStore('queue').delete(item.id);
        await new Promise((res, rej) => { del.onsuccess = () => res(true); del.onerror = () => rej(del.error); });
      } catch {
        // retain on failure
      }
    }
  }

  async setCache(key: string, value: any) {
    const db = await this.db();
    const tx = db.transaction('cache', 'readwrite');
    const req = tx.objectStore('cache').put({ key, value, updated_at: new Date().toISOString() });
    await new Promise((res, rej) => { req.onsuccess = () => res(true); req.onerror = () => rej(req.error); });
  }
  async getCache(key: string) {
    const db = await this.db();
    const tx = db.transaction('cache', 'readonly');
    const req = tx.objectStore('cache').get(key);
    const row = await new Promise<any>((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
    return row?.value;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.syncAll());
    }
  }
}
