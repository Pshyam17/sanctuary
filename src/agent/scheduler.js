import { GoogleGenerativeAI } from "@google/generative-ai"
import { saveSchedule, getSchedule } from "./idb"
import { KEYS, loadJSON, saveJSON, emitUpdate } from "../lib/storage"
import { GEMINI_MODEL, safeResponseText } from "./model"

function buildSchedulePrompt(ctx) {
  const tasks = loadJSON(KEYS.tasks, [])
    .filter((t) => !t.done)
    .slice(0, 5)
    .map((t) => t.text)
  const avoiding = loadJSON(KEYS.profile, {}).avoiding || []
  const emotional = localStorage.getItem(KEYS.emotional) || "not set"
  const day = new Date().toLocaleDateString("en-US", { weekday: "long" })
  const checkinMsg = localStorage.getItem(KEYS.lastCheckinMsg) || ""

  return `You are writing today's personalised notification schedule for Preethi.

WHAT YOU KNOW ABOUT HER TODAY:
- Energy level: ${ctx.energy_level}
- Emotional state: ${emotional}
- Movement assigned: ${ctx.movement_type}
- Focus area: ${ctx.focus_area || "mixed"}
- Currently avoiding: ${avoiding.join(", ") || "none"}
- Active tasks right now: ${tasks.join(", ") || "none"}
- What she told you this morning: ${checkinMsg}
- Day of week: ${day}
- Notes: ${ctx.notes || ""}

HER PROFILE:
- Building a tech career on a student visa (CPT/OPT)
- Anxiety paralysis, dissociation, depression
- Skates and walks
- Reads Atomic Habits and Clear Thinking
- Dreams of her own apartment and independence
- Responds to directness, not softness

TONE RULES BY TIME:
- 6-10am: one calm intention, grounding, no pressure
- 10am-2pm: blunt, direct, one specific action from her actual task list by name
- 2-6pm: systems language, Clear Thinking style, one decision
- 6-9pm: one reflective question, warm not heavy
- 9pm+: permission to rest, soft close, no guilt

LOW DAY RULES (energy 1-2):
- Never mention productivity or output
- Movement: exactly "10 minutes outside. No goal. Just move your body, Preethi."
- Career: the absolute smallest possible action from her task list — by name
- Mental wellness: one grounding sentence

MEDIUM DAY RULES (energy 3):
- Movement: go skate — even 20 minutes
- Career: one real named action, direct

HIGH DAY RULES (energy 4-5):
- Movement: longer skate or push yourself
- Career: 2 named actions from her actual task list

RULES FOR EVERY MESSAGE:
- Address her as Preethi
- Reference her actual tasks by their real names when possible
- Never "you've got this" or "believe in yourself"
- Never exclamation marks
- Maximum 2 sentences per notification
- Sound like a person who knows her, not an app

RETURN ONLY valid JSON array of 5-8 objects (fewer on low days):
[{"time":"9:15am","message":"...","tag":"career","book_reference":"optional"}]`
}

function parseScheduleJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim()
  const start = cleaned.indexOf("[")
  const end = cleaned.lastIndexOf("]")
  if (start === -1) return []
  return JSON.parse(cleaned.slice(start, end + 1))
}

export async function generateSchedule(context) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) return []
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })
  const prompt = buildSchedulePrompt(context)
  const result = await model.generateContent(prompt)
  const raw = parseScheduleJson(safeResponseText(result.response))
  const schedule = raw.map((item, idx) => ({
    ...item,
    id: `${Date.now()}-${idx}`,
    sent: false,
  }))
  await saveSchedule(schedule)
  localStorage.setItem(KEYS.lastSchedule, new Date().toISOString())
  localStorage.setItem(KEYS.notifications, JSON.stringify(schedule))
  const profile = loadJSON(KEYS.profile, {})
  saveJSON(KEYS.profile, {
    ...profile,
    energyLevel: context.energy_level,
    movementType: context.movement_type,
    focusArea: context.focus_area || "mixed",
  })
  localStorage.setItem(
    KEYS.checkin,
    JSON.stringify({
      date: new Date().toDateString(),
      energy: context.energy_level,
      movement: context.movement_type,
      focus: context.focus_area || "mixed",
      emotional: localStorage.getItem(KEYS.emotional),
    }),
  )
  emitUpdate()
  return schedule
}

export async function regenerateSlots({ reason, new_energy }) {
  const current = await getSchedule()
  const energy = new_energy ?? Number(localStorage.getItem(KEYS.energy) || 3)
  if (new_energy) localStorage.setItem(KEYS.energy, String(new_energy))

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) return current
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })
  const prompt = `${buildSchedulePrompt({ energy_level: energy, movement_type: "walk", notes: reason })}
Only regenerate afternoon and evening slots (2pm onwards). Return JSON array.`
  const result = await model.generateContent(prompt)
  const afternoon = parseScheduleJson(safeResponseText(result.response))
  const now = new Date()
  const kept = current.filter((n) => {
    const [time, ampm] = n.time.split(/(am|pm)/i)
    const [h] = time.split(":").map(Number)
    let hour = h
    if (ampm?.toLowerCase() === "pm" && h !== 12) hour += 12
    return hour < 14 && n.sent
  })
  const merged = [
    ...kept,
    ...afternoon.map((item, idx) => ({ ...item, id: `regen-${Date.now()}-${idx}`, sent: false })),
  ]
  await saveSchedule(merged.length ? merged : afternoon)
  localStorage.setItem(KEYS.lastSchedule, now.toISOString())
  emitUpdate()
  return merged
}
