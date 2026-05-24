export const KEYS = {
  tasks: "sanctuary_tasks",
  profile: "sanctuary_profile",
  emotional: "sanctuary_emotional_state",
  energy: "sanctuary_energy_level",
  doneCount: "sanctuary_done_count",
  streak: "sanctuary_streak",
  lastActive: "sanctuary_last_active_day",
  chat: "sanctuary_chat",
  lastChatDay: "sanctuary_last_chat_day",
  checkin: "sanctuary_checkin",
  avoiding: "sanctuary_avoiding",
  notifications: "sanctuary_notifications",
  lastSchedule: "sanctuary_last_schedule_update",
  lastCheckinMsg: "sanctuary_last_checkin_message",
}

export function emitUpdate() {
  window.dispatchEvent(new Event("sanctuary-update"))
}

export function loadJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

export function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  emitUpdate()
}

export function getGreeting() {
  const h = new Date().getHours()
  if (h < 6) return { line: "Still up, Preethi.", sub: "Late nights count too." }
  if (h < 10) return { line: "Good morning, Preethi.", sub: "Here. Present. That already counts." }
  if (h < 13) return { line: "Hey Preethi.", sub: "Don't overthink the morning. Just move." }
  if (h < 17) return { line: "Still going, Preethi.", sub: "Afternoon drift hits hard. One task." }
  if (h < 20) return { line: "Evening, Preethi.", sub: "What does today prove about who you're becoming?" }
  return { line: "Winding down, Preethi.", sub: "Rest is productive. Really." }
}

export const NUDGES = {
  fog: "Fog today. You don't have to see the whole road — just the next step. Water counts.",
  stone: "Frozen isn't broken. Your nervous system is overwhelmed, not defeated. One breath, then one sentence.",
  hollow: "Hollow is hard. You showed up today. That is genuinely enough — let's make it survivable.",
}

export const VISION =
  "The woman in her own apartment, career built by her own hands — she's not a fantasy. She's you, stacking ordinary days."
