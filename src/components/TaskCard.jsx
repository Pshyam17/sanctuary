const TAG_COLORS = {
  life: "var(--gold)",
  work: "var(--ember)",
  self: "var(--sage)",
}

export default function TaskCard({ task, onToggle }) {
  return (
    <div
      className={`card task-card fade-up ${task.done ? "task-done" : ""}`}
      style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
    >
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? "Mark incomplete" : "Mark done"}
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          border: `2px solid ${task.done ? "var(--sage)" : "var(--border2)"}`,
          background: task.done ? "var(--sage-dim)" : "transparent",
          flexShrink: 0,
          marginTop: 2,
          cursor: "pointer",
        }}
      />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 15, textDecoration: task.done ? "line-through" : "none" }}>
          {task.text}
        </p>
        <span
          className="tag-pill"
          style={{
            marginTop: 8,
            color: TAG_COLORS[task.tag] || "var(--text-mid)",
            borderColor: TAG_COLORS[task.tag] || "var(--border)",
          }}
        >
          {task.tag}
        </span>
      </div>
    </div>
  )
}
