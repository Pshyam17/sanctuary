import { useCallback, useEffect, useState } from "react"
import { KEYS, saveJSON } from "../lib/storage"

const MORNING =
  "Morning, Preethi. Quick check-in — how's your energy today?\nGive me a number 1-5 or just a word.\nI'll set up your day from there."

export function useChat() {
  const [messages, setMessages] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(KEYS.chat) || "[]")
    if (saved.length) return saved
    return [{ role: "assistant", text: MORNING }]
  })
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    const today = new Date().toDateString()
    const last = localStorage.getItem(KEYS.lastChatDay)
    if (last !== today) {
      localStorage.setItem(KEYS.lastChatDay, today)
      setMessages([{ role: "assistant", text: MORNING }])
      saveJSON(KEYS.chat, [{ role: "assistant", text: MORNING }])
    }
  }, [])

  const persist = useCallback((next) => {
    setMessages(next)
    saveJSON(KEYS.chat, next)
  }, [])

  const append = (msg) => persist([...messages, msg])

  return { messages, setMessages: persist, append, typing, setTyping, MORNING }
}
