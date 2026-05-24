const DB_NAME = "sanctuary"
const STORE = "schedule"

function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" })
    req.onsuccess = () => res(req.result)
    req.onerror = rej
  })
}

export async function saveSchedule(notifications) {
  const db = await openDB()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    const store = tx.objectStore(STORE)
    store.clear()
    notifications.forEach((n) => store.put(n))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage("CHECK_NOTIFICATIONS")
  }
}

export async function getSchedule() {
  const db = await openDB()
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readonly")
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => res(req.result)
    req.onerror = rej
  })
}
