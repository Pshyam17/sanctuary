const CACHE_NAME = "sanctuary-v1"
const APP_SHELL = ["/", "/index.html", "/manifest.json"]

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))))
  self.clients.claim()
})

self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)))
})

self.addEventListener("message", (e) => {
  if (e.data === "CHECK_NOTIFICATIONS") checkAndFire()
})

async function checkAndFire() {
  const db = await openDB()
  const schedule = await getSchedule(db)
  const now = new Date()
  for (const notif of schedule) {
    if (notif.sent) continue
    const [time, ampm] = notif.time.split(/(am|pm)/i)
    const [h, m] = time.split(":").map(Number)
    const hour = ampm?.toLowerCase() === "pm" && h !== 12 ? h + 12 : h
    const notifTime = new Date()
    notifTime.setHours(hour, m || 0, 0, 0)
    if (now >= notifTime) {
      await self.registration.showNotification("Sanctuary", {
        body: notif.message,
        icon: "/icons/192.png",
        badge: "/icons/192.png",
        tag: notif.id,
        data: { url: "/" },
      })
      await markSent(db, notif.id)
    }
  }
}

self.addEventListener("notificationclick", (e) => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data.url))
})

function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open("sanctuary", 1)
    req.onupgradeneeded = () => req.result.createObjectStore("schedule", { keyPath: "id" })
    req.onsuccess = () => res(req.result)
    req.onerror = rej
  })
}

function getSchedule(db) {
  return new Promise((res, rej) => {
    const tx = db.transaction("schedule", "readonly")
    const req = tx.objectStore("schedule").getAll()
    req.onsuccess = () => res(req.result)
    req.onerror = rej
  })
}

function markSent(db, id) {
  return new Promise((res, rej) => {
    const tx = db.transaction("schedule", "readwrite")
    const store = tx.objectStore("schedule")
    const req = store.get(id)
    req.onsuccess = () => {
      const notif = req.result
      if (notif) {
        notif.sent = true
        store.put(notif)
      }
      res()
    }
    req.onerror = rej
  })
}
