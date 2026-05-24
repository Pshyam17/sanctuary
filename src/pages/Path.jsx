import { useEffect, useState } from "react"
import TaskCard from "../components/TaskCard"
import RewardFlash from "../components/RewardFlash"
import { matchLifeChain } from "../data/lifeChains"
import { useTasks } from "../hooks/useTasks"
import { useProfile } from "../hooks/useProfile"
import { generateTaskBreakdown } from "../agent/gemini"

export default function Path() {
  const [input, setInput] = useState("")
  const [suggestion, setSuggestion] = useState(null)
  const [breakdown, setBreakdown] = useState(null)
  const [flash, setFlash] = useState(false)
  const { tasks, addTask, setTasks, incomplete, complete } = useTasks()
  const { emotionalState, incrementDone } = useProfile()

  useEffect(() => {
    if (!suggestion) return
    const t = setTimeout(() => setSuggestion(null), 9000)
    return () => clearTimeout(t)
  }, [suggestion])

  async function submitTask() {
    if (!input.trim()) return
    const text = input.trim()
    const chain = matchLifeChain(text)
    if (chain) setSuggestion(chain)

    addTask(text, chain?.tag || "life")
    setInput("")

    if (emotionalState === "stone" || emotionalState === "fog") {
      const bd = await generateTaskBreakdown(text)
      if (bd) setBreakdown(bd)
    }
  }

  function toggleTask(id) {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id)
      if (task && !task.done) {
        setFlash(true)
        incrementDone()
        setTimeout(() => setFlash(false), 600)
      }
      return prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    })
  }

  const sorted = [...incomplete, ...complete]

  return (
    <main className="page">
      <RewardFlash show={flash} />
      <h2 className="display" style={{ fontSize: 28, margin: "0 0 16px" }}>
        Path
      </h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          className="input-field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitTask()}
          placeholder="Tell me what's happening in your life..."
        />
        <button type="button" className="btn-ember" onClick={submitTask} style={{ padding: "0 16px" }}>
          +
        </button>
      </div>

      {suggestion && (
        <button
          type="button"
          className="suggestion-card"
          style={{ width: "100%", textAlign: "left", cursor: "pointer", color: "inherit" }}
          onClick={() => {
            addTask(suggestion.next, suggestion.tag)
            setSuggestion(null)
          }}
        >
          <span style={{ fontSize: 18 }}>💡</span>
          <p style={{ margin: "8px 0 0", color: "var(--gold)", fontWeight: 500 }}>{suggestion.next}</p>
          <p style={{ fontSize: 11, color: "var(--text-soft)", margin: "6px 0 0" }}>
            Tap to add →
          </p>
        </button>
      )}

      {breakdown && (
        <div className="breakdown-card fade-up">
          <p className="label-mono" style={{ color: "var(--ember)" }}>
            Microstep
          </p>
          <p style={{ color: "var(--ember)", fontSize: 16, margin: "6px 0" }}>{breakdown.microstep}</p>
          {breakdown.next_steps?.map((s, i) => (
            <p key={i} style={{ color: "var(--text-soft)", fontSize: 13, margin: "4px 0" }}>
              → {s}
            </p>
          ))}
          <p style={{ fontStyle: "italic", color: "var(--text-mid)", fontSize: 13, marginTop: 10 }}>
            {breakdown.note}
          </p>
          <button
            type="button"
            className="btn-sage"
            style={{ marginTop: 10 }}
            onClick={() => {
              if (breakdown.next_steps?.[0]) addTask(breakdown.next_steps[0], "self")
              setBreakdown(null)
            }}
          >
            Add as next task
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column" }}>
        {sorted.map((task) => (
          <TaskCard key={task.id} task={task} onToggle={toggleTask} />
        ))}
      </div>
    </main>
  )
}
