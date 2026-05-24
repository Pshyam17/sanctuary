import { useEffect, useState } from "react"
import BookQuote from "../components/BookQuote"
import { useTypewriter } from "../hooks/useTypewriter"
import { useProfile } from "../hooks/useProfile"
import { generateFuelParagraph } from "../agent/gemini"

export default function Fuel() {
  const { profile } = useProfile()
  const [paragraph, setParagraph] = useState("")
  const [loading, setLoading] = useState(true)
  const displayed = useTypewriter(paragraph, 16)

  async function loadParagraph() {
    setLoading(true)
    setParagraph("")
    try {
      const text = await generateFuelParagraph(profile)
      setParagraph(text)
    } catch {
      setParagraph("Couldn't reach the agent right now. Your path still counts.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadParagraph()
  }, [])

  return (
    <main className="page">
      <h2 className="display" style={{ fontSize: 28, margin: "0 0 16px" }}>
        Fuel
      </h2>

      <div className="card fade-up" style={{ marginBottom: 20 }}>
        <BookQuote variant="fuel" />
      </div>

      <div className="card fade-up">
        <p className="label-mono" style={{ color: "var(--ember)" }}>
          For you today
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.6, marginTop: 12, minHeight: 80 }}>
          {loading && !displayed ? "..." : displayed}
          {!loading && displayed.length < paragraph.length && <span className="cursor-blink">|</span>}
        </p>
        <button type="button" className="btn-ghost" style={{ marginTop: 14 }} onClick={loadParagraph}>
          Give me another
        </button>
      </div>
    </main>
  )
}
