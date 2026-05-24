import { saveSchedule, getSchedule } from "./idb"
import { KEYS, loadJSON, saveJSON, emitUpdate } from "../lib/storage"
import { medium, textOf } from "./models"

function buildSchedulePrompt(ctx, { mode = "full" } = {}) {
  const tasks = loadJSON(KEYS.tasks, [])
    .filter((t) => !t.done)
    .slice(0, 5)
    .map((t) => t.text)
  const avoiding = loadJSON(KEYS.profile, {}).avoiding || []
  const emotional = localStorage.getItem(KEYS.emotional) || "not set"
  const day = new Date().toLocaleDateString("en-US", { weekday: "long" })
  const checkinMsg = localStorage.getItem(KEYS.lastCheckinMsg) || ""

  const regenLine =
    mode === "afternoon"
      ? "Only regenerate the afternoon and evening slots (2pm onwards)."
      : "Cover the full day."

  return `Write today's notification schedule for Preethi.

TODAY
- Energy: ${ctx.energy_level}
- State: ${emotional}
- Movement: ${ctx.movement_type}
- Focus: ${ctx.focus_area || "mixed"}
- Avoiding: ${avoiding.join(", ") || "nothing flagged"}
- Active tasks: ${tasks.join(" | ") || "none"}
- What she said this morning: ${checkinMsg || "nothing yet"}
- Day: ${day}

PROFILE
- Tech career on student visa (CPT/OPT)
- Anxiety paralysis, dissociation, depression
- Skates and walks
- Reads Atomic Habits and Clear Thinking
- Dreams of her own apartment and independence

TONE BY TIME
- 6-10am: calm, grounding, one intention
- 10am-2pm: blunt, direct, one named task
- 2-6pm: systems language, one decision
- 6-9pm: one reflective question
- 9pm+: permission to rest, no guilt

LOW DAY (energy 1-2): gentle, no productivity pressure
- movement message must be exactly: "10 minutes outside. No goal. Just move your body, Preethi."
- career = smallest possible named action from her task list
- wellness = one grounding sentence

MEDIUM DAY (energy 3): direct, one real named action
- movement = "go skate — even 20 minutes resets everything"

HIGH DAY (energy 4-5): ambitious, 2 named actions
- movement = "longer skate today — push yourself"
- reference a founder or pioneer naturally (Karpathy, Naval, Hopper, Lovelace, Goggins, etc)

ALWAYS
- One mental wellness slot every day regardless of energy
- One fitness slot on medium and high days
- Reference her actual task names by name, not generic verbs
- Address her as Preethi
- Max 2 sentences per notification
- No exclamation marks
- No "you've got this"

${regenLine}

Return JSON array only, no markdown, no commentary:
[{"id":"unique-string","time":"9:15am","message":"...","tag":"career"|"body"|"mind","book_reference":"optional short quote","sent":false}]`
}

function parseScheduleJson(text) {
  if (!text) return []
  const cleaned = text.replace(/```json|```/g, "").trim()
  const start = cleaned.indexOf("[")
  const end = cleaned.lastIndexOf("]")
  if (start === -1 || end === -1) return []
  try {
    return JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    return []
  }
}

function normalize(items) {
  return items.map((item, idx) => ({
    id: item.id || `slot-${Date.now()}-${idx}`,
    time: item.time,
    message: item.message,
    tag: item.tag || "mind",
    book_reference: item.book_reference || "",
    sent: false,
  }))
}

function snapshotCheckin(context) {
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
  const profile = loadJSON(KEYS.profile, {})
  saveJSON(KEYS.profile, {
    ...profile,
    energyLevel: context.energy_level,
    movementType: context.movement_type,
    focusArea: context.focus_area || "mixed",
  })
}

export async function generateSchedule(context) {
  try {
    const completion = await medium({
      messages: [
        { role: "system", content: "You are Preethi's personal schedule writer. Output JSON array only." },
        { role: "user", content: buildSchedulePrompt(context) },
      ],
      temperature: 0.6,
      max_tokens: 1200,
    })
    const schedule = normalize(parseScheduleJson(textOf(completion)))
    if (schedule.length === 0) return []
    await saveSchedule(schedule)
    localStorage.setItem(KEYS.lastSchedule, new Date().toISOString())
    localStorage.setItem(KEYS.notifications, JSON.stringify(schedule))
    snapshotCheckin(context)
    emitUpdate()
    return schedule
  } catch (err) {
    console.error("generateSchedule failed", err)
    return []
  }
}

function hourOf(time) {
  const m = /(\d{1,2}):?(\d{0,2})\s*(am|pm)/i.exec(time || "")
  if (!m) return 0
  let h = Number(m[1])
  const min = Number(m[2] || 0)
  const ampm = m[3].toLowerCase()
  if (ampm === "pm" && h !== 12) h += 12
  if (ampm === "am" && h === 12) h = 0
  return h + min / 60
}

export async function regenerateSlots({ reason, new_energy } = {}) {
  const current = await getSchedule()
  const energy = new_energy ?? Number(localStorage.getItem(KEYS.energy) || 3)
  if (new_energy) localStorage.setItem(KEYS.energy, String(new_energy))

  try {
    const completion = await medium({
      messages: [
        { role: "system", content: "You are Preethi's schedule writer. Output JSON array only." },
        {
          role: "user",
          content: buildSchedulePrompt(
            { energy_level: energy, movement_type: energy <= 2 ? "walk" : "skate", notes: reason || "" },
            { mode: "afternoon" },
          ),
        },
      ],
      temperature: 0.6,
      max_tokens: 900,
    })
    const afternoon = normalize(parseScheduleJson(textOf(completion)))
    const kept = current.filter((n) => hourOf(n.time) < 14 && n.sent)
    const merged = [...kept, ...afternoon]
    await saveSchedule(merged.length ? merged : afternoon)
    localStorage.setItem(KEYS.lastSchedule, new Date().toISOString())
    emitUpdate()
    return merged
  } catch (err) {
    console.error("regenerateSlots failed", err)
    return current
  }
}
