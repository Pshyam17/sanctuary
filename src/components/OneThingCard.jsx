import { useState } from "react"
import { oneThings } from "../data/oneThings"

export default function OneThingCard({ tasks, onDone }) {
  const [fallbackIdx, setFallbackIdx] = useState(0)
  const incomplete = tasks.filter((t) => !t.done)
  const active = incomplete[0]
  const text = active?.text || oneThings[fallbackIdx % oneThings.length]
  const isTask = Boolean(active)

  return (
    <div className="card fade-up one-thing-card">
      <p className="label-mono" style={{ color: "var(--ember)", marginBottom: 8 }}>
        One thing
      </p>
      <p className="one-thing-text">{text}</p>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          type="button"
          className="btn-ember"
          onClick={() => {
            if (isTask) onDone(active.id)
            else onDone(null)
          }}
        >
          Done
        </button>
        {!isTask && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setFallbackIdx((i) => i + 1)}
          >
            Different one
          </button>
        )}
      </div>
    </div>
  )
}
