// File objects stay in this browser's IndexedDB; no upload endpoint is involved.
export async function storedAsset(key, mode, value) {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('clock-local', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('images');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return new Promise((resolve, reject) => {
    const tx = db.transaction('images', mode === 'get' ? 'readonly' : 'readwrite');
    const store = tx.objectStore('images');
    const request = mode === 'get' ? store.get(key) : mode === 'delete' ? store.delete(key) : store.put(value, key);
    tx.oncomplete = () => { resolve(request.result); db.close(); };
    tx.onerror = tx.onabort = () => { reject(tx.error); db.close(); };
  });
}
