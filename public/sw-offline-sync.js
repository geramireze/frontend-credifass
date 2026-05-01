// Service Worker custom para escrituras offline de Credifass.
// ngsw-worker.js cubre los GETs. Este SW cubre los POSTs de pagos y abonos.
// Registrado desde main.ts solo en producción.

const DB_NAME    = 'credifass-offline';
const DB_VERSION = 1;
const STORES     = { pagos: 'cf_pagos_pendientes', abonos: 'cf_abonos_pendientes' };

const PAGO_RE   = /\/v1\/cf\/ventas\/[^/]+\/pagos$/;
const ABONO_RE  = /\/v1\/cf\/reservas\/[^/]+\/abonos$/;

// ─── Intercepción de fetch ────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'POST') return;

  const pathname = new URL(event.request.url).pathname;
  const isPago   = PAGO_RE.test(pathname);
  const isAbono  = ABONO_RE.test(pathname);

  if (isPago || isAbono) {
    event.respondWith(
      handleOfflineWrite(event.request, isPago ? STORES.pagos : STORES.abonos)
    );
  }
});

async function handleOfflineWrite(request, storeName) {
  try {
    // Online: dejar pasar sin modificar
    const response = await fetch(request.clone());
    return response;
  } catch {
    // Sin red: encolar en IndexedDB
    const body       = await request.json().catch(() => ({}));
    const authHeader = request.headers.get('Authorization');
    const idemKey    = body.idempotency_key || crypto.randomUUID();

    await saveToIDB(storeName, {
      id:               crypto.randomUUID(),
      url:              request.url,
      auth_header:      authHeader,
      idempotency_key:  idemKey,
      payload:          { ...body, idempotency_key: idemKey },
      timestamp_local:  new Date().toISOString(),
      estado_sync:      'pendiente',
    });

    // Registrar Background Sync para cuando vuelva la conexión
    const tag = storeName === STORES.pagos ? 'cf-sync-pagos' : 'cf-sync-abonos';
    await self.registration.sync.register(tag).catch(() => {});

    return new Response(JSON.stringify({ offline: true, idempotency_key: idemKey }), {
      status:  202,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ─── Background Sync ──────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'cf-sync-pagos')  event.waitUntil(syncPendientes(STORES.pagos));
  if (event.tag === 'cf-sync-abonos') event.waitUntil(syncPendientes(STORES.abonos));
});

async function syncPendientes(storeName) {
  const pendientes = await getAllFromIDB(storeName);

  for (const item of pendientes) {
    if (item.estado_sync === 'error_permanente') continue;

    try {
      const res = await fetch(item.url, {
        method:  'POST',
        headers: {
          'Content-Type':    'application/json',
          'Idempotency-Key': item.idempotency_key,
          ...(item.auth_header ? { Authorization: item.auth_header } : {}),
        },
        body: JSON.stringify(item.payload),
      });

      if (res.ok || res.status === 409) {
        // 2xx = procesado; 409 = idempotency ya existe en el backend = OK
        await deleteFromIDB(storeName, item.id);
      } else if (res.status === 401 || res.status === 403 || res.status === 422) {
        // Errores permanentes: no reintentar para no ciclar
        await markErrorIDB(storeName, item.id, res.status);
      }
      // Otros errores (5xx, network timeout): se reintenta en el próximo sync
    } catch {
      // Error de red: vuelve a intentar en el próximo sync
    }
  }
}

// ─── Helpers IndexedDB ───────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORES.pagos)) {
        db.createObjectStore(STORES.pagos, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.abonos)) {
        db.createObjectStore(STORES.abonos, { keyPath: 'id' });
      }
    };

    req.onsuccess  = (e) => resolve(e.target.result);
    req.onerror    = (e) => reject(e.target.error);
  });
}

async function saveToIDB(storeName, record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put(record);
    req.onsuccess = () => resolve();
    req.onerror   = (e) => reject(e.target.error);
  });
}

async function getAllFromIDB(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

async function deleteFromIDB(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = (e) => reject(e.target.error);
  });
}

async function markErrorIDB(storeName, id, statusCode) {
  const db = await openDB();
  return new Promise(async (resolve, reject) => {
    const tx      = db.transaction(storeName, 'readwrite');
    const store   = tx.objectStore(storeName);
    const getReq  = store.get(id);
    getReq.onsuccess = (e) => {
      const record = e.target.result;
      if (!record) { resolve(); return; }
      const putReq = store.put({ ...record, estado_sync: 'error_permanente', error_code: statusCode });
      putReq.onsuccess = () => resolve();
      putReq.onerror   = (e2) => reject(e2.target.error);
    };
    getReq.onerror = (e) => reject(e.target.error);
  });
}
