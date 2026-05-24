import { useEffect, useState } from "react"
import { quotes } from "../data/quotes"

export default function BookQuote({ variant = "strip" }) {
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setIdx((i) => (i + 1) % quotes.length)
        setFade(true)
      }, 400)
    }, 30000)
    return () => clearInterval(id)
  }, [])

  const q = quotes[idx]
  const isFuel = variant === "fuel"

  return (
    <div
      className={`fade-up ${isFuel ? "" : "quote-strip"}`}
      style={{
        opacity: fade ? 1 : 0,
        transition: "opacity 0.4s ease",
        background: isFuel ? "transparent" : "var(--gold-dim)",
        borderRadius: isFuel ? 0 : 18,
        padding: isFuel ? 0 : "14px 16px",
        marginTop: isFuel ? 0 : 12,
      }}
    >
      <p
        style={{
          fontFamily: '"Fraunces", serif',
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: isFuel ? 22 : 15,
          lineHeight: 1.45,
          margin: 0,
        }}
      >
        "{q.quote}"
      </p>
      <p
        className="label-mono"
        style={{ color: "var(--gold)", fontSize: isFuel ? 11 : 10, marginTop: 8 }}
      >
        {q.source} · {q.book}
      </p>
      {isFuel && (
        <p style={{ color: "var(--text-mid)", fontSize: 14, lineHeight: 1.55, marginTop: 14 }}>
          {q.apply}
        </p>
      )}
    </div>
  )
}
