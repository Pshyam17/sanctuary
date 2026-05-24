import { useEffect, useState } from "react"
import AvatarCanvas from "../components/AvatarCanvas"
import BreathCard from "../components/BreathCard"
import OneThingCard from "../components/OneThingCard"
import BookQuote from "../components/BookQuote"
import RewardFlash from "../components/RewardFlash"
import { useProfile } from "../hooks/useProfile"
import { useTasks } from "../hooks/useTasks"
import { getGreeting, NUDGES, VISION } from "../lib/storage"

const AVATARS = [
  { type: "fog", name: "Fog", desc: "Drifting far" },
  { type: "stone", name: "Stone", desc: "Frozen still" },
  { type: "hollow", name: "Hollow", desc: "Empty quiet" },
]

export default function Home() {
  const [greeting, setGreeting] = useState(getGreeting)
  const { emotionalState, setEmotional, doneCount, streak, incrementDone } = useProfile()
  const { tasks, setTasks, incomplete } = useTasks()
  const [flash, setFlash] = useState(false)
  const [toast, setToast] = useState("")

  useEffect(() => {
    const id = setInterval(() => setGreeting(getGreeting()), 60000)
    return () => clearInterval(id)
  }, [])

  function triggerReward(label) {
    setFlash(true)
    setToast(label || "Done.")
    incrementDone()
    setTimeout(() => setFlash(false), 600)
    setTimeout(() => setToast(""), 2400)
  }

  function handleOneThingDone(taskId) {
    if (taskId) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: true } : t)))
    }
    triggerReward("One thing down.")
  }

  return (
    <main className="page">
      <RewardFlash show={flash} />
      {toast && <div className="toast">{toast}</div>}

      <h1 className="display greeting">
        {greeting.line.replace(/\s*Preethi\.?\s*$/, " ")}
        <span style={{ color: "var(--ember)", fontStyle: "italic" }}>Preethi.</span>
      </h1>
      <p className="greeting-sub">{greeting.sub}</p>

      <div className="avatar-row">
        {AVATARS.map((a) => (
          <button
            key={a.type}
            type="button"
            className={`avatar-btn fade-up ${emotionalState === a.type ? `selected-${a.type}` : ""}`}
            onClick={() => setEmotional(a.type)}
          >
            <AvatarCanvas type={a.type} />
            <span className="label-mono">{a.name}</span>
            <span style={{ color: "var(--text-soft)", fontSize: 11 }}>{a.desc}</span>
          </button>
        ))}
      </div>

      {emotionalState && NUDGES[emotionalState] && (
        <div
          className="nudge-banner fade-up"
          style={{
            background:
              emotionalState === "fog"
                ? "rgba(122,158,181,0.1)"
                : emotionalState === "stone"
                  ? "rgba(136,140,143,0.1)"
                  : "rgba(138,122,170,0.1)",
          }}
        >
          {NUDGES[emotionalState]}
        </div>
      )}

      <BreathCard />
      <OneThingCard tasks={tasks} onDone={handleOneThingDone} />
      <BookQuote />
      <div className="vision-strip fade-up">
        <p className="display" style={{ fontStyle: "italic", fontSize: 17, margin: 0, lineHeight: 1.45 }}>
          {VISION}
        </p>
        <div className="vision-stats">
          <div className="vision-stat">
            <strong>{doneCount}</strong>
            <span className="label-mono" style={{ color: "var(--text-soft)" }}>
              done
            </span>
          </div>
          <div className="vision-divider" />
          <div className="vision-stat">
            <strong>{streak}</strong>
            <span className="label-mono" style={{ color: "var(--text-soft)" }}>
              streak
            </span>
          </div>
          <div className="vision-divider" />
          <div className="vision-stat">
            <strong>∞</strong>
            <span className="label-mono" style={{ color: "var(--text-soft)" }}>
              building
            </span>
          </div>
        </div>
      </div>
      {incomplete.length > 0 && (
        <p style={{ color: "var(--text-soft)", fontSize: 12, marginTop: 12, textAlign: "center" }}>
          {incomplete.length} open on your path
        </p>
      )}
    </main>
  )
}
