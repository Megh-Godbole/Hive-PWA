function openIndexedDB() {
  return idb.openDB('hive-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('sync-tasks')) {
        db.createObjectStore('sync-tasks', { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('sync-inventory')) {
        db.createObjectStore('sync-inventory', { autoIncrement: true });
      }
    }
  });
}