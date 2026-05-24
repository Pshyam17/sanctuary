import { useNavigate } from "react-router-dom"

const TAG_STYLES = {
  career: { color: "var(--ember)", bg: "var(--ember-dim)" },
  body: { color: "var(--fog-color)", bg: "rgba(122,158,181,0.12)" },
  mind: { color: "var(--sage)", bg: "var(--sage-dim)" },
}

export default function NotifSlot({ slot }) {
  const navigate = useNavigate()
  const style = TAG_STYLES[slot.tag] || TAG_STYLES.mind

  return (
    <button
      type="button"
      className="card fade-up notif-slot"
      onClick={() =>
        navigate("/chat", { state: { prefill: `Edit my ${slot.time} notification: ` } })
      }
      style={{ textAlign: "left", width: "100%", cursor: "pointer" }}
    >
      <span className="time-badge" style={{ background: style.bg, color: style.color }}>
        {slot.time}
      </span>
      <p style={{ fontSize: 13, margin: "10px 0 0", lineHeight: 1.5 }}>{slot.message}</p>
      {slot.book_reference && (
        <p style={{ fontSize: 10, fontStyle: "italic", color: "var(--gold)", margin: "6px 0 0" }}>
          {slot.book_reference}
        </p>
      )}
      <span className="tag-pill" style={{ marginTop: 8, color: style.color, borderColor: style.color }}>
        {slot.tag}
      </span>
    </button>
  )
}
