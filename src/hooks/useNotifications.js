import { useCallback, useEffect, useState } from "react"
import { KEYS } from "../lib/storage"
import { getSchedule } from "../agent/idb"

export function useNotifications() {
  const [schedule, setSchedule] = useState([])
  const [lastUpdate, setLastUpdate] = useState(
    () => localStorage.getItem(KEYS.lastSchedule) || null,
  )
  const [checkin, setCheckin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.checkin) || "null")
    } catch {
      return null
    }
  })

  const refresh = useCallback(async () => {
    const rows = await getSchedule()
    setSchedule(rows)
    setLastUpdate(localStorage.getItem(KEYS.lastSchedule))
    try {
      setCheckin(JSON.parse(localStorage.getItem(KEYS.checkin) || "null"))
    } catch {
      setCheckin(null)
    }
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener("sanctuary-update", refresh)
    return () => window.removeEventListener("sanctuary-update", refresh)
  }, [refresh])

  return { schedule, setSchedule, lastUpdate, checkin, refresh }
}
