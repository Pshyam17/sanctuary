import { GoogleGenerativeAI } from "@google/generative-ai"
import { tools } from "./functions"
import { buildSystemPrompt } from "./systemPrompt"
import { generateSchedule, regenerateSlots } from "./scheduler"
import { saveSchedule, getSchedule } from "./idb"
import { KEYS, loadJSON, saveJSON, emitUpdate } from "../lib/storage"

function loadState() {
  const tasks = loadJSON(KEYS.tasks, [])
  const profile = loadJSON(KEYS.profile, { avoiding: [] })
  return {
    tasks,
    profile,
    emotionalState: localStorage.getItem(KEYS.emotional) || "not set",
    energyLevel: localStorage.getItem(KEYS.energy) || "not set",
  }
}

function persistTasks(tasks) {
  saveJSON(KEYS.tasks, tasks)
}

function inferEnergy(text) {
  const lower = text.toLowerCase()
  if (/\b(1|one|exhaust|bad day|terrible|hollow|empty|can't)\b/.test(lower)) return 1
  if (/\b(2|two|low|rough|tired|drained)\b/.test(lower)) return 2
  if (/\b(3|three|okay|ok|medium|mid)\b/.test(lower)) return 3
  if (/\b(4|four|good|solid|focused)\b/.test(lower)) return 4
  if (/\b(5|five|great|high|energized|ready)\b/.test(lower)) return 5
  return null
}

function inferMovement(energy) {
  if (energy <= 2) return "walk"
  if (energy >= 4) return "long_skate"
  return "skate"
}

async function executeFunction(call) {
  const args = call.args || {}
  const state = loadState()
  let result = { ok: true }

  switch (call.name) {
    case "add_task": {
      const tasks = [...state.tasks, { id: crypto.randomUUID(), text: args.text, tag: args.tag, done: false }]
      persistTasks(tasks)
      result = { added: args.text }
      break
    }
    case "complete_task": {
      const lower = (args.description || "").toLowerCase()
      const tasks = state.tasks.map((t) =>
        !t.done && t.text.toLowerCase().includes(lower) ? { ...t, done: true } : t,
      )
      persistTasks(tasks)
      result = { completed: args.description }
      break
    }
    case "set_emotional_state":
      localStorage.setItem(KEYS.emotional, args.state)
      emitUpdate()
      result = { state: args.state }
      break
    case "set_day_schedule": {
      localStorage.setItem(KEYS.energy, String(args.energy_level))
      localStorage.setItem(KEYS.lastCheckinMsg, args.notes || "")
      await generateSchedule({
        energy_level: args.energy_level,
        movement_type: args.movement_type,
        focus_area: args.focus_area,
        notes: args.notes,
      })
      result = { scheduled: true }
      break
    }
    case "update_notification": {
      const schedule = await getSchedule()
      const updated = schedule.map((n) =>
        n.time === args.time ? { ...n, message: args.new_message, tag: args.tag || n.tag } : n,
      )
      await saveSchedule(updated)
      localStorage.setItem(KEYS.lastSchedule, new Date().toISOString())
      emitUpdate()
      result = { updated: args.time }
      break
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
      result = { added: args.time }
      break
    }
    case "update_avoiding": {
      const profile = { ...state.profile, avoiding: args.items }
      saveJSON(KEYS.profile, profile)
      result = { avoiding: args.items }
      break
    }
    case "clear_done_tasks": {
      persistTasks(state.tasks.filter((t) => !t.done))
      result = { cleared: true }
      break
    }
    case "draft_message": {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
      const draft = await model.generateContent(
        `Draft a ${args.type} for Preethi. Context: ${args.context}. Direct, warm, no exclamation marks. Ready to copy.`,
      )
      result = { draft: draft.response.text() }
      break
    }
    case "regenerate_slot":
      await regenerateSlots({ reason: args.reason, new_energy: args.new_energy })
      result = { regenerated: true }
      break
    default:
      result = { error: "unknown function" }
  }

  return {
    functionResponse: { name: call.name, response: result },
  }
}

function shouldAutoSchedule(message, calls) {
  if (calls.some((c) => c.name === "set_day_schedule")) return false
  const energy = inferEnergy(message)
  return energy !== null
}

export async function sendToSanctuary(message, history = []) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) return { text: "Add your Gemini API key in .env.local first.", calls: [] }

  const state = loadState()
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    tools,
    systemInstruction: buildSystemPrompt({
      avoiding: state.profile.avoiding || [],
      emotionalState: state.emotionalState,
      energyLevel: state.energyLevel,
      activeTasks: state.tasks.filter((t) => !t.done).map((t) => t.text),
    }),
  })

  const chatHistory = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-12)
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }))

  const chat = model.startChat({ history: chatHistory })
  let result = await chat.sendMessage(message)
  let response = result.response
  const allCalls = []
  const meta = []

  let guard = 0
  while (response.functionCalls()?.length && guard < 6) {
    guard += 1
    const calls = response.functionCalls()
    allCalls.push(...calls)
    const functionResponses = []
    for (const call of calls) {
      const fr = await executeFunction(call)
      functionResponses.push(fr)
      meta.push({ name: call.name, result: fr.functionResponse.response })
    }
    result = await chat.sendMessage(functionResponses)
    response = result.response
  }

  if (shouldAutoSchedule(message, allCalls)) {
    const energy = inferEnergy(message)
    const movement = inferMovement(energy)
    localStorage.setItem(KEYS.lastCheckinMsg, message)
    await generateSchedule({
      energy_level: energy,
      movement_type: movement,
      focus_area: "mixed",
      notes: message,
    })
    allCalls.push({ name: "set_day_schedule", args: { energy_level: energy, movement_type: movement } })
  }

  const lower = message.toLowerCase()
  if (/\b(exhaust|bad day|really struggling|can't do)\b/.test(lower) && !allCalls.some((c) => c.name === "set_emotional_state")) {
    localStorage.setItem(KEYS.emotional, "hollow")
    const e = Math.max(1, Number(localStorage.getItem(KEYS.energy) || 3) - 2)
    localStorage.setItem(KEYS.energy, String(e))
    await regenerateSlots({ reason: message, new_energy: e })
    emitUpdate()
  }

  const draft = meta.find((m) => m.name === "draft_message")?.result?.draft
  let text = response.text() || ""
  if (!text && draft) text = "Here's your draft — copy below."
  return { text: text || "Done.", calls: allCalls, meta }
}

export async function generateTaskBreakdown(taskText) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) return null
  const emotional = localStorage.getItem(KEYS.emotional)
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
  const prompt = `Preethi added this task while feeling ${emotional || "overwhelmed"}: "${taskText}"
Return ONLY JSON: {"microstep":"under 2 min action","next_steps":["step2","step3"],"note":"warm direct note, no toxic positivity, no exclamation marks"}`
  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json|```/g, "").trim()
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  return JSON.parse(text.slice(start, end + 1))
}

export async function generateFuelParagraph(profile) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) return "Add your API key to generate fuel."
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
  const prompt = `Write 4-5 sentences for Preethi. Style: Dean Graziosi warmth + real friend who gets mental health + tech founder directness.
Profile: student visa CPT/OPT, anxiety/dissociation/depression, skates and walks, wants own apartment and tech career.
Currently avoiding: ${(profile.avoiding || []).join(", ") || "unknown"}
Emotional state: ${localStorage.getItem(KEYS.emotional) || "not set"}
Rules: no "you've got this", no "believe in yourself", no exclamation marks. Reference at least one specific detail (apartment, visa, skating, career, dissociation).`
  const result = await model.generateContent(prompt)
  return result.response.text()
}
