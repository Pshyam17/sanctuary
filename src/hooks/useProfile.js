import { useCallback, useEffect, useState } from "react"
import { KEYS, emitUpdate, loadJSON, saveJSON } from "../lib/storage"

export function useProfile() {
  const [profile, setProfileState] = useState(() =>
    loadJSON(KEYS.profile, { avoiding: [], energyLevel: null, focusArea: null, movementType: null }),
  )
  const [emotionalState, setEmotionalState] = useState(
    () => localStorage.getItem(KEYS.emotional) || null,
  )
  const [doneCount, setDoneCount] = useState(() => Number(localStorage.getItem(KEYS.doneCount) || 0))
  const [streak, setStreak] = useState(() => Number(localStorage.getItem(KEYS.streak) || 0))

  const sync = useCallback(() => {
    setProfileState(loadJSON(KEYS.profile, { avoiding: [] }))
    setEmotionalState(localStorage.getItem(KEYS.emotional) || null)
    setDoneCount(Number(localStorage.getItem(KEYS.doneCount) || 0))
    setStreak(Number(localStorage.getItem(KEYS.streak) || 0))
  }, [])

  useEffect(() => {
    window.addEventListener("sanctuary-update", sync)
    return () => window.removeEventListener("sanctuary-update", sync)
  }, [sync])

  const setEmotional = (state) => {
    if (state) localStorage.setItem(KEYS.emotional, state)
    else localStorage.removeItem(KEYS.emotional)
    setEmotionalState(state)
    emitUpdate()
  }

  const incrementDone = () => {
    const today = new Date().toDateString()
    const last = localStorage.getItem(KEYS.lastActive)
    let nextStreak = streak
    if (last !== today) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      nextStreak = last === yesterday.toDateString() ? streak + 1 : 1
      localStorage.setItem(KEYS.streak, String(nextStreak))
      localStorage.setItem(KEYS.lastActive, today)
      setStreak(nextStreak)
    }
    const next = doneCount + 1
    localStorage.setItem(KEYS.doneCount, String(next))
    setDoneCount(next)
    emitUpdate()
  }

  const setProfile = (next) => {
    saveJSON(KEYS.profile, next)
    setProfileState(next)
  }

  return { profile, setProfile, emotionalState, setEmotional, doneCount, streak, incrementDone }
}
