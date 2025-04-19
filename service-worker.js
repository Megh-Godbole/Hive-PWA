const CACHE_NAME = 'hive-cache-v1';

/**
 * Install service worker.
 */
self.addEventListener('install', function (event) {
  console.log('Installed:', event);
  self.skipWaiting();

  //Create static cache.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        cache.addAll([
          '/',
          '/index.html',
          '/styles.css',
          '/js/app.js',
          '/js/db.js',
          '/js/firebase-config.js',
          '/assets/icons/favicon-96x96.png',
          '/manifest.json',
        ]);
      })
      .catch(function (error) {
        console.log('Cache Failed:', error)
      })
  );
});

/**
* Activate service worker.
*/
self.addEventListener('activate', function (event) {
  console.log('Activated:', event);
  event.waitUntil(clients.claim());

  // Remove the cache
  event.waitUntil(caches.keys().then(function (cacheNames) {
    return Promise.all(cacheNames
      .filter(item => item !== CACHE_NAME)
      .map(item => caches.delete(item))
    );
  }));
});

/**
* Get cached data.
* Network with Cache Fallback strategy.
*/
self.addEventListener('fetch', function (event) {
  event.respondWith(
    fetch(event.request)
      .catch(function () {
        return caches.match(event.request);
      })
  );
});

self.addEventListener('sync', event => {

  // sync only when battery level is sufficient.
  const isBatteryLow = localStorage.getItem('isBatteryLow') === 'true';

  if (isBatteryLow) {
    console.log('Battery is low, skipping sync');
    return; // Skip sync if battery is low
  }

  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncPendingTasks());
  }
  if (event.tag === 'sync-inventory') {
    event.waitUntil(syncInventoryItems());
  }
});

async function syncPendingTasks() {
  const localDb = await openIndexedDB();
  const tx = localDb.transaction('sync-tasks', 'readonly');
  const store = tx.objectStore('sync-tasks');
  const allTasks = await store.getAll();
  const keys = await store.getAllKeys();
  await tx.done;

  for (let i = 0; i < allTasks.length; i++) {
    try {
      await firebase.firestore().collection('tasks').add(allTasks[i]);

      // Delete after successful sync
      const deleteTx = localDb.transaction('sync-tasks', 'readwrite');
      deleteTx.objectStore('sync-tasks').delete(keys[i]);
      await deleteTx.done;
    } catch (err) {
      console.error('Failed to sync task:', allTasks[i], err);
    }
  }
}

async function syncInventoryItems() {
  const db = await idb.openDB('hive-app-db', 1);
  const allItems = await db.getAll('sync-inventory');

  const promises = allItems.map(async (item) => {
    await self.registration.firebase.firestore().collection("inventory").add(item);
  });

  await Promise.all(promises);

  // Clear the store
  const tx = db.transaction('sync-inventory', 'readwrite');
  tx.store.clear();
  await tx.done;
}



