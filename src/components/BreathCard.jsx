import { useEffect, useState } from "react"

const PHASES = [
  { label: "Breathe in", sec: 4 },
  { label: "Hold", sec: 4 },
  { label: "Breathe out", sec: 4 },
  { label: "Rest", sec: 2 },
]

export default function BreathCard() {
  const [active, setActive] = useState(false)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => {
      setTick((t) => {
        const phase = PHASES[phaseIdx]
        if (t + 1 >= phase.sec) {
          setPhaseIdx((i) => (i + 1) % PHASES.length)
          return 0
        }
        return t + 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [active, phaseIdx])

  const phase = PHASES[phaseIdx]
  const progress = ((tick + 1) / phase.sec) * 100

  return (
    <button
      type="button"
      className="card fade-up breath-card"
      onClick={() => {
        if (active) {
          setActive(false)
          setPhaseIdx(0)
          setTick(0)
        } else {
          setActive(true)
        }
      }}
    >
      <div
        className="breath-orb"
        style={{
          transform: `scale(${active ? 1 + Math.sin(Date.now() / 400) * 0.08 : 1})`,
          opacity: active ? 0.9 : 0.5,
        }}
      />
      <div>
        <p className="label-mono" style={{ color: "var(--sage)" }}>
          {active ? phase.label : "Box breath"}
        </p>
        <p style={{ color: "var(--text-mid)", fontSize: 13, margin: "4px 0 0" }}>
          {active ? `${phase.sec - tick}s · 4-4-4-2` : "Tap to start · 4s in, 4 hold, 4 out, 2 rest"}
        </p>
      </div>
      {active && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 2,
            width: `${progress}%`,
            background: "var(--sage)",
            transition: "width 1s linear",
          }}
        />
      )}
    </button>
  )
}
