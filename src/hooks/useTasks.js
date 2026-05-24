import { useCallback, useEffect, useState } from "react"
import { KEYS, emitUpdate, loadJSON, saveJSON } from "../lib/storage"

export function useTasks() {
  const [tasks, setTasksState] = useState(() => loadJSON(KEYS.tasks, []))

  const sync = useCallback(() => setTasksState(loadJSON(KEYS.tasks, [])), [])

  useEffect(() => {
    window.addEventListener("sanctuary-update", sync)
    return () => window.removeEventListener("sanctuary-update", sync)
  }, [sync])

  const setTasks = (updater) => {
    setTasksState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater
      saveJSON(KEYS.tasks, next)
      return next
    })
  }

  const addTask = (text, tag = "life") => {
    setTasks((prev) => [...prev, { id: crypto.randomUUID(), text, tag, done: false }])
  }

  const completeTask = (description) => {
    const lower = description.toLowerCase()
    setTasks((prev) =>
      prev.map((t) =>
        !t.done && t.text.toLowerCase().includes(lower) ? { ...t, done: true } : t,
      ),
    )
  }

  const clearDone = () => setTasks((prev) => prev.filter((t) => !t.done))

  const incomplete = tasks.filter((t) => !t.done)
  const complete = tasks.filter((t) => t.done)

  return { tasks, setTasks, addTask, completeTask, clearDone, incomplete, complete }
}
