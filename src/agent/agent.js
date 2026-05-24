import { tools } from "./functions"
import { buildSystemPrompt } from "./systemPrompt"
import { generateSchedule, regenerateSlots } from "./scheduler"
import { saveSchedule, getSchedule } from "./idb"
import { KEYS, loadJSON, saveJSON, emitUpdate } from "../lib/storage"
import { heavy, light, medium, textOf, toolCallsOf, formatNimError, hasKey } from "./models"

/* ------------------------------------------------------------------ */
/* state helpers                                                       */
/* ------------------------------------------------------------------ */

function loadState() {
  const tasks = loadJSON(KEYS.tasks, [])
  const profile = loadJSON(KEYS.profile, { avoiding: [] })
  return {
    tasks,
    profile,
    emotionalState: localStorage.getItem(KEYS.emotional) || "not set",
    energyLevel: localStorage.getItem(KEYS.energy) || "not set",
    lastCheckinMsg: localStorage.getItem(KEYS.lastCheckinMsg) || "",
  }
}

function persistTasks(tasks) {
  saveJSON(KEYS.tasks, tasks)
}

/* ------------------------------------------------------------------ */
/* function execution                                                  */
/* ------------------------------------------------------------------ */

async function executeFunction(name, args = {}) {
  const state = loadState()

  switch (name) {
    case "add_task": {
      const tasks = [
        ...state.tasks,
        { id: crypto.randomUUID(), text: args.text, tag: args.tag || "life", done: false },
      ]
      persistTasks(tasks)
      return { added: args.text }
    }
    case "complete_task": {
      const lower = (args.description || "").toLowerCase()
      const tasks = state.tasks.map((t) =>
        !t.done && t.text.toLowerCase().includes(lower) ? { ...t, done: true } : t,
      )
      persistTasks(tasks)
      return { completed: args.description }
    }
    case "set_emotional_state": {
      localStorage.setItem(KEYS.emotional, args.state)
      emitUpdate()
      return { state: args.state }
    }
    case "set_day_schedule": {
      localStorage.setItem(KEYS.energy, String(args.energy_level))
      if (args.notes) localStorage.setItem(KEYS.lastCheckinMsg, args.notes)
      await generateSchedule({
        energy_level: args.energy_level,
        movement_type: args.movement_type,
        focus_area: args.focus_area,
        notes: args.notes,
      })
      return { scheduled: true }
    }
    case "update_notification": {
      const schedule = await getSchedule()
      const updated = schedule.map((n) =>
        n.time === args.time ? { ...n, message: args.new_message, tag: args.tag || n.tag } : n,
      )
      await saveSchedule(updated)
      localStorage.setItem(KEYS.lastSchedule, new Date().toISOString())
      emitUpdate()
      return { updated: args.time }
    }
    case "add_notification": {
      const schedule = await getSchedule()
      schedule.push({
        id: `add-${Date.now()}`,
        time: args.time,
        message: args.message,
        tag: args.tag,
        book_reference: args.book_reference || "",
        sent: false,
      })
      await saveSchedule(schedule)
      emitUpdate()
      return { added: args.time }
    }
    case "update_avoiding": {
      const profile = { ...state.profile, avoiding: args.items }
      saveJSON(KEYS.profile, profile)
      return { avoiding: args.items }
    }
    case "clear_done_tasks": {
      persistTasks(state.tasks.filter((t) => !t.done))
      return { cleared: true }
    }
    case "draft_message": {
      const draft = await draftMessage(args.type, args.context)
      return { draft }
    }
    case "regenerate_slot": {
      await regenerateSlots({ reason: args.reason, new_energy: args.new_energy })
      return { regenerated: true }
    }
    default:
      return { error: `unknown function ${name}` }
  }
}

async function draftMessage(type, context) {
  const stylePerType = {
    linkedin_outreach: "LinkedIn outreach, 3 sentences, warm but specific, no fluff",
    follow_up_email:
      "Follow-up email after 5 days, 4 sentences, polite + clear ask, no apologizing for following up",
    thank_you_email: "Thank-you email within 24h of an interview, 4 sentences, specific to one thing discussed",
    cold_email: "Cold email, 4 sentences, hook + relevance + ask, no 'hope this finds you well'",
  }
  const style = stylePerType[type] || "Direct professional message, 3-4 sentences."
  const completion = await medium({
    messages: [
      {
        role: "system",
        content:
          "You draft outreach for Preethi. No exclamation marks. Direct, warm, ready to copy. Output only the message body.",
      },
      { role: "user", content: `${style}\n\nContext: ${context}` },
    ],
    temperature: 0.5,
    max_tokens: 350,
  })
  return textOf(completion).trim()
}

/* ------------------------------------------------------------------ */
/* main chat turn                                                      */
/* ------------------------------------------------------------------ */

const MAX_TOOL_TURNS = 6

function buildHistory(history) {
  return history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.text }))
}

export async function sendToSanctuary(message, history = []) {
  if (!hasKey()) {
    return { text: "Add your NVIDIA NIM key to .env.local first (VITE_NIM_API_KEY).", calls: [], meta: [] }
  }

  try {
    const state = loadState()
    const systemPrompt = buildSystemPrompt({
      avoiding: state.profile.avoiding || [],
      emotionalState: state.emotionalState,
      energyLevel: state.energyLevel,
      activeTasks: state.tasks.filter((t) => !t.done).map((t) => t.text),
      lastCheckinMsg: state.lastCheckinMsg,
    })

    const messages = [
      { role: "system", content: systemPrompt },
      ...buildHistory(history),
      { role: "user", content: message },
    ]

    const allCalls = []
    const meta = []
    let finalText = ""
    let guard = 0

    while (guard < MAX_TOOL_TURNS) {
      guard += 1
      const completion = await heavy({ messages, tools, tool_choice: "auto" })
      const choice = completion?.choices?.[0]
      const assistantMsg = choice?.message
      const calls = toolCallsOf(completion)

      if (calls.length === 0) {
        finalText = textOf(completion)
        // record assistant message in conversation
        messages.push(assistantMsg || { role: "assistant", content: finalText })
        break
      }

      // record assistant tool_call message before responding to each call
      messages.push(assistantMsg)

      for (const call of calls) {
        let args = {}
        try {
          args = JSON.parse(call.function?.arguments || "{}")
        } catch {
          args = {}
        }
        const result = await executeFunction(call.function?.name, args)
        allCalls.push({ name: call.function?.name, args })
        meta.push({ name: call.function?.name, result })
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        })
      }
    }

    // ---- post-turn heuristics (don't override the model, only fill gaps) ----

    // morning energy auto-schedule if model didn't already
    if (!allCalls.some((c) => c.name === "set_day_schedule")) {
      const energy = await parseEnergy(message)
      if (energy !== null) {
        const movement = energy <= 2 ? "walk" : energy >= 4 ? "long_skate" : "skate"
        localStorage.setItem(KEYS.energy, String(energy))
        localStorage.setItem(KEYS.lastCheckinMsg, message)
        await generateSchedule({
          energy_level: energy,
          movement_type: movement,
          focus_area: "mixed",
          notes: message,
        })
        allCalls.push({
          name: "set_day_schedule",
          args: { energy_level: energy, movement_type: movement, focus_area: "mixed" },
        })
      }
    }

    // crisis-language safety net — sets state + drops energy if model missed it
    const lower = message.toLowerCase()
    if (
      /\b(exhausted|bad day|really struggling|can'?t do|broke down|burnt out|burnout)\b/.test(lower) &&
      !allCalls.some((c) => c.name === "set_emotional_state")
    ) {
      localStorage.setItem(KEYS.emotional, "hollow")
      const e = Math.max(1, Number(localStorage.getItem(KEYS.energy) || 3) - 2)
      localStorage.setItem(KEYS.energy, String(e))
      await regenerateSlots({ reason: message, new_energy: e })
      emitUpdate()
    }

    const draft = meta.find((m) => m.name === "draft_message")?.result?.draft
    if (!finalText && draft) finalText = "Here's your draft — copy below."
    if (!finalText && allCalls.length) finalText = "Updated. Check Notifications or Path."
    return { text: finalText || "Done.", calls: allCalls, meta }
  } catch (err) {
    console.error("sendToSanctuary", err)
    return { text: formatNimError(err), calls: [], meta: [], error: true }
  }
}

/* ------------------------------------------------------------------ */
/* light helpers: energy parse + task breakdown + fuel paragraph       */
/* ------------------------------------------------------------------ */

/**
 * Parses an energy level 1-5 from her morning check-in text.
 * Uses LIGHT model first (cheap), falls back to a regex if model returns garbage.
 */
export async function parseEnergy(text) {
  if (!text) return null
  if (!hasKey()) return regexEnergy(text)
  try {
    const completion = await light({
      messages: [
        {
          role: "system",
          content:
            "Extract the energy level from the user's message. Reply with ONLY a single digit 1-5, or the word none. No other text.",
        },
        { role: "user", content: text },
      ],
      max_tokens: 5,
      temperature: 0,
    })
    const raw = textOf(completion).trim().toLowerCase()
    const m = /[1-5]/.exec(raw)
    if (m) return Number(m[0])
    if (raw.startsWith("none")) return regexEnergy(text)
    return regexEnergy(text)
  } catch {
    return regexEnergy(text)
  }
}

function regexEnergy(text) {
  const lower = text.toLowerCase()
  if (/\b(1|one|exhaust|bad day|terrible|hollow|empty|can'?t)\b/.test(lower)) return 1
  if (/\b(2|two|low|rough|tired|drained)\b/.test(lower)) return 2
  if (/\b(3|three|okay|ok|medium|mid|alright)\b/.test(lower)) return 3
  if (/\b(4|four|good|solid|focused)\b/.test(lower)) return 4
  if (/\b(5|five|great|high|energized|ready)\b/.test(lower)) return 5
  return null
}

export async function generateTaskBreakdown(taskText) {
  if (!hasKey()) return null
  try {
    const emotional = localStorage.getItem(KEYS.emotional)
    const completion = await medium({
      messages: [
        {
          role: "system",
          content:
            'Return ONLY JSON: {"microstep":"under 2 min action","next_steps":["step2","step3"],"note":"warm direct note, no toxic positivity, no exclamation marks"}',
        },
        {
          role: "user",
          content: `Preethi added this task while feeling ${emotional || "overwhelmed"}: "${taskText}"`,
        },
      ],
      temperature: 0.4,
      max_tokens: 400,
    })
    const text = textOf(completion).replace(/```json|```/g, "").trim()
    const start = text.indexOf("{")
    const end = text.lastIndexOf("}")
    if (start === -1 || end === -1) return null
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}

export async function generateFuelParagraph(profile) {
  if (!hasKey()) return "Add your NIM key to .env.local to generate fuel."
  try {
    const avoiding = (profile?.avoiding || []).join(", ") || "nothing flagged"
    const emotional = localStorage.getItem(KEYS.emotional) || "not set"
    const completion = await heavy({
      messages: [
        {
          role: "system",
          content: `You write a 4-5 sentence motivational paragraph for Preethi.
She is on a student visa (CPT/OPT), building a tech career, manages anxiety/dissociation/depression, skates and walks, wants her own apartment and full independence.
Tone: Dean Graziosi warmth + a real friend who gets mental health + tech-founder directness.
Hard rules: no "you've got this", no "believe in yourself", no exclamation marks. Reference at least one specific detail from her life (apartment, visa, skating, career, dissociation). 4-5 sentences only. Output only the paragraph.`,
        },
        {
          role: "user",
          content: `Currently avoiding: ${avoiding}\nEmotional state: ${emotional}\nWrite the paragraph now.`,
        },
      ],
      temperature: 0.75,
      max_tokens: 350,
    })
    const text = textOf(completion).trim()
    return text || "Couldn't reach the agent. Your path still counts."
  } catch (err) {
    return formatNimError(err)
  }
}
