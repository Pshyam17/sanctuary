import NotifSlot from "../components/NotifSlot"
import { useNotifications } from "../hooks/useNotifications"

export default function Notifications() {
  const { schedule, lastUpdate, checkin } = useNotifications()
  const today = new Date().toDateString()
  const hasCheckin = checkin?.date === today

  return (
    <main className="page">
      <h2 className="display" style={{ fontSize: 28, margin: "0 0 16px" }}>
        Notifications
      </h2>

      <div className="card fade-up" style={{ marginBottom: 14 }}>
        <p className="label-mono" style={{ color: "var(--sage)" }}>
          Morning check-in
        </p>
        {hasCheckin ? (
          <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6 }}>
            <p style={{ margin: "4px 0" }}>
              Energy: <strong>{checkin.energy}</strong> · Movement: {checkin.movement}
            </p>
            <p style={{ margin: "4px 0" }}>
              Focus: {checkin.focus} · State: {checkin.emotional || "not set"}
            </p>
          </div>
        ) : (
          <p style={{ color: "var(--text-soft)", fontSize: 14, marginTop: 8 }}>
            Morning check-in pending — open Chat to start your day.
          </p>
        )}
      </div>

      <div style={{ display: "grid", gap: 0 }}>
        {schedule.length === 0 ? (
          <p style={{ color: "var(--text-soft)", fontSize: 14 }}>
            No schedule yet. Tell Chat your energy level to generate today's notifications.
          </p>
        ) : (
          schedule.map((slot) => <NotifSlot key={slot.id} slot={slot} />)
        )}
      </div>

      {lastUpdate && (
        <p style={{ color: "var(--text-soft)", fontSize: 12, marginTop: 16 }}>
          agent updated schedule at{" "}
          {new Date(lastUpdate).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </p>
      )}

      <div className="card fade-up" style={{ marginTop: 16, background: "var(--sage-dim)" }}>
        <p className="label-mono" style={{ color: "var(--sage)" }}>
          Install on iPhone
        </p>
        <ol style={{ color: "var(--text-mid)", fontSize: 13, lineHeight: 1.6, paddingLeft: 18, margin: "10px 0 0" }}>
          <li>Open Sanctuary in Safari (not Chrome)</li>
          <li>Tap Share → Add to Home Screen</li>
          <li>Open from home screen and allow notifications</li>
          <li>Requires iOS 16.4 or later</li>
        </ol>
      </div>
    </main>
  )
}
